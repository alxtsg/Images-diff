import childProcess from 'child_process';

import config from './config.js'

import type ComparisonResult from './types/comparison-result';

const COMPARISON_METRIC = 'mse';
const COMPARISON_RESULT_REGEX = /\d+\.?\d*(e-)?\d* \((\d+\.?\d*(e-)?\d*)\)/;

// Expected length of regular expression matching result.
const RESULTS_LENGTH = 4;
// The index of value that represents the difference in the matching results.
const DIFF_RESULT_INDEX = 2;

// ImageMagick compare program returns 2 on error.
// https://imagemagick.org/script/compare.php
const COMPARISON_ERROR_CODE = 2;
const STANDARD_OUTPUT = '-';

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
    'compare',
    '-metric',
    COMPARISON_METRIC,
    original,
    altered
  ];
  if (config.cropConfig !== null) {
    const { width, height, offsetX, offsetY } = config.cropConfig;
    const cropDimension = `${width}x${height}+${offsetX}+${offsetY}`;
    args.push(...[
      '-crop',
      cropDimension
    ]);
  }
  // Write differences to standard output to avoid writing useless data to disk.
  args.push(STANDARD_OUTPUT);
  return new Promise((resolve, reject) => {
    const magick = childProcess.spawn(
      config.magickPath,
      args,
      {
        // Ignore both stdin and stdout as only the stderr is being read.
        stdio: ['ignore', 'ignore', 'pipe']
      }
    );
    const outputLines: string[] = [];
    magick.once('error', (error) => {
      reject(error);
      return;
    });
    // ImageMagick writes comparison result to stderr (standard error output).
    // https://legacy.imagemagick.org/discourse-server/viewtopic.php?t=9292
    magick.stderr.on('data', (data) => {
      outputLines.push(Buffer.from(data, 'utf8').toString());
    });
    magick.once('close', (code) => {
      if (code === COMPARISON_ERROR_CODE) {
        reject(new Error(`Compare program exited with code ${code}.`));
        return;
      }
      const output = outputLines.join('');
      const results = output.match(COMPARISON_RESULT_REGEX);
      if (!Array.isArray(results) || (results.length !== RESULTS_LENGTH)) {
        reject(new Error(`Unexpected comparison output: ${output}`));
        return;
      }
      resolve({
        original,
        altered,
        difference: Number(results[DIFF_RESULT_INDEX])
      });
    });
  });
};
