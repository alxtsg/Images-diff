import childProcess from 'child_process';
import os from 'os';

import config from './config'
import diffCheckers from './diff-checkers';
import Metric from './metric';

import type ComparisonPair from './types/comparison-pair';
import type ComparisonResult from './types/comparison-result';

const WORK_BATCH_SIZE = os.cpus().length;

// ImageMagick compare program returns 2 on error.
// https://imagemagick.org/script/compare.php
const IM_COMPARISON_ERROR_CODE = 2;
const FFMPEG_SUCCESS_EXIT_CODE = 0;
const FFMPEG_SSIM_OUTPUT_REGEX = /All:(\d?(\.\d+)?)/;

const diffChecker = diffCheckers.get(config.metric);

if (!diffChecker) {
  throw new Error('Unable to load diff checker.');
}

/**
 * Compares images using MSE as the metric.
 *
 * @param original Path of original (reference) image.
 * @param altered Path of altered image.
 *
 * @returns A Promise resolves with the comparison result.
 */
const mse = async (original: string, altered: string): Promise<ComparisonResult> => {
  const args = [
    altered,
    original
  ];
  if (config.cropConfig !== null) {
    const { width, height, offsetX, offsetY } = config.cropConfig;
    const cropDimension = `${width}x${height}+${offsetX}+${offsetY}`;
    args.push(...[
      '-crop',
      cropDimension
    ]);
  }
  args.push(...[
    '-metric',
    'MSE',
    '-compare',
    '-format',
    '%[distortion]',
    'info:'
  ]);
  return new Promise((resolve, reject) => {
    const magick = childProcess.spawn(
      config.magickPath,
      args,
      {
        // Ignore both stdin and stderr as only the stdout is being read.
        stdio: ['ignore', 'pipe', 'ignore']
      }
    );
    const outputLines: string[] = [];
    magick.once('error', (error) => {
      reject(error);
      return;
    });
    magick.stdout.on('data', (data) => {
      outputLines.push(Buffer.from(data, 'utf8').toString());
    });
    magick.once('close', (code) => {
      if (code === IM_COMPARISON_ERROR_CODE) {
        reject(new Error(`Compare program exited with code ${code} when comparing ${original} and ${altered}.`));
        return;
      }
      const output = Number(outputLines.join(''));
      if (Number.isNaN(output)) {
        reject(new Error(`Unexpected comparison output when comparing ${original} and ${altered}: ${output}`));
        return;
      }
      resolve({
        original,
        altered,
        difference: output,
        isAbnormal: diffChecker(output)
      });
    });
  });
};

/**
 * Compares images using SSIM as the metric.
 *
 * @param original Path of original (reference) image.
 * @param altered Path of altered image.
 *
 * @returns A Promise resolves with the comparison result.
 */
const ssim = async (original: string, altered: string): Promise<ComparisonResult> => {
  if (!config.ffmpegPath) {
    throw new Error('Unable to locate FFmpeg.');
  }
  const args = [
    '-i',
    altered,
    '-i',
    original,
    '-hide_banner',
    '-filter_complex'
  ];
  if (config.cropConfig !== null) {
    const { width, height, offsetX, offsetY } = config.cropConfig;
    const cropDimension = `${width}:${height}:${offsetX}:${offsetY}`;
    const line = [
      `[0:v]crop='${cropDimension}'[v1];`,
      `[1:v]crop='${cropDimension}'[v2];`,
      '[v1][v2]ssim'
    ].join('');
    args.push(line);
  } else {
    args.push('ssim');
  }
  args.push(...[
    '-an',
    '-f',
    'null',
    '-'
  ]);
  return new Promise((resolve, reject) => {
    const ffmpeg = childProcess.spawn(
      config.ffmpegPath,
      args,
      {
        // Ignore both stdin and stdout as only the stdout is being read.
        stdio: ['ignore', 'ignore', 'pipe']
      }
    );
    const outputLines: string[] = [];
    ffmpeg.stderr.on('data', (data) => {
      outputLines.push(Buffer.from(data, 'utf8').toString());
    });
    ffmpeg.once('close', (code) => {
      if (code !== FFMPEG_SUCCESS_EXIT_CODE) {
        reject(new Error(`Compare program exited with code ${code} when comparing ${original} and ${altered}.`));
        return;
      }
      const output = outputLines.join('');
      const results = FFMPEG_SSIM_OUTPUT_REGEX.exec(output);
      if ((results === null) || (results.length < 2)) {
        reject(new Error(`Unexpected comparison output when comparing ${original} and ${altered}: ${output}`));
        return;
      }
      // Get the first matching group.
      const difference = Number(results[1]);
      if (Number.isNaN(difference)) {
        reject(new Error(`Unexpected SSIM value when comparing ${original} and ${altered}: ${results[1]}`));
        return;
      }
      resolve({
        original,
        altered,
        difference,
        isAbnormal: diffChecker(difference)
      });
    });
  });
};

const comparisonFunctionsMap = new Map([
  [Metric.MSE, mse],
  [Metric.SSIM,ssim]
]);

/**
 * Compares images and report comparison result.
 *
 * @param original Path of original (reference) image.
 * @param altered Path of altered image.
 *
 * @returns A Promise resolves with the comparison result.
 */
export const compareImages = async (original: string, altered: string): Promise<ComparisonResult> => {
  const comparisonFunction = comparisonFunctionsMap.get(config.metric);
  if (!comparisonFunction) {
    throw new Error(`No comparison function found for metric ${config.metric}.`);
  }
  const result = await comparisonFunction(original, altered);
  return result;
};

/**
 * Compares
 * @param paths Paths of images.
 */
export const compareImageBatch = async (paths: string[]): Promise<ComparisonResult[]> => {
  const pairs: ComparisonPair[] = [];
  paths.forEach((path, index) => {
    if (index === 0) {
      return;
    }
    pairs.push({
      original: paths[index - 1],
      altered: path
    });
  });
  const results: ComparisonResult[] = [];
  while (pairs.length > 0) {
    const batch = [];
    for (let i = 0; i < WORK_BATCH_SIZE; i += 1) {
      const pair = pairs.shift();
      if (!pair) {
        break;
      }
      batch.push(compareImages(pair.original, pair.altered));
    }
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}
