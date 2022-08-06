import childProcess from 'child_process';
import os from 'os';

import config from './config.js'
import diffCheckers from './diff-checkers';

import type ComparisonPair from './types/comparison-pair';
import type ComparisonResult from './types/comparison-result';

const WORK_BATCH_SIZE = os.cpus().length;

// ImageMagick compare program returns 2 on error.
// https://imagemagick.org/script/compare.php
const COMPARISON_ERROR_CODE = 2;

const diffChecker = diffCheckers.get(config.metric);

if (!diffChecker) {
  throw new Error('Unable to load diff checker.');
}

/**
 * Compares images and report comparison result.
 *
 * @param original Path of original (reference) image.
 * @param altered Path of altered image.
 *
 * @returns A Promise resolves with the comparison result.
 */
export const compareImages = async (original: string, altered: string): Promise<ComparisonResult> => {
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
    config.metric,
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
      if (code === COMPARISON_ERROR_CODE) {
        reject(new Error(`Compare program exited with code ${code}.`));
        return;
      }
      const output = Number(outputLines.join(''));
      if (Number.isNaN(output)) {
        reject(new Error(`Unexpected comparison output: ${output}`));
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
