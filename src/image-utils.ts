import path from 'path';

import ComparisonResult from './types/comparison-result';
import CropConfig from './types/crop-config';
import GMBatchCommandRunner from './gm-batch-command-runner';

const COMPARISON_METRIC: string = 'mse';
const COMPARISON_RESULT_REGEX: RegExp = /Total: (\d+\.?\d*)/gm;

/**
 * Crops images.
 *
 * @param cropConfig Image cropping configurations.
 * @param outputDir Directory for cropped images.
 * @param files Absolute paths of images to be cropped.
 *
 * @returns Resolves without a value.
 */
export const cropImages = async (cropConfig: CropConfig, outputDir: string, files: string[]): Promise<void> => {
  const { width, height, offsetX, offsetY } = cropConfig;
  const commands: string[] = files.map((file) => {
    const outputFile: string = path.join(outputDir, path.basename(file));
    return [
      'convert',
      `"${file}"`,
      '-crop',
      `${width}x${height}+${offsetX}+${offsetY}`,
      `"${outputFile}"`,
      '\n'
    ].join(' ');
  });
  const runner: GMBatchCommandRunner = new GMBatchCommandRunner();
  return new Promise((resolve, reject) => {
    runner.once(GMBatchCommandRunner.EVENT_ERROR, (error: Error) => {
      reject(error);
    })
    runner.once(GMBatchCommandRunner.EVENT_DONE, () => {
      resolve();
    });
    runner.run(commands);
  });
};

/**
 * Compares images.
 *
 * @param files Absolute paths of images to be compared.
 *
 * @returns Resolves with an array of comparison results.
 */
export const compareImages = async (files: string[]): Promise<ComparisonResult[]> => {
  const commands: string[] = files.map((file, index) => {
      if (index === 0) {
        return '';
      }
      const origin: string = files[index - 1];
      const altered: string = file;
      return [
        'compare',
        '-metric',
        `${COMPARISON_METRIC}`,
        `"${origin}"`,
        `"${altered}"`,
        '\n'
      ].join(' ');
    })
    .filter((command) => (command !== ''));
  const results: ComparisonResult[] = [];
  const runner: GMBatchCommandRunner = new GMBatchCommandRunner();
  let index: number = 0;
  return new Promise((resolve, reject) => {
    runner.once(GMBatchCommandRunner.EVENT_ERROR, (error: Error) => {
      reject(error);
    })
    runner.once(GMBatchCommandRunner.EVENT_DONE, () => {
      resolve(results);
    });
    runner.on(GMBatchCommandRunner.EVENT_DATA, (data) => {
      const matches = data.matchAll(COMPARISON_RESULT_REGEX);
      for (const match of matches) {
        const [ _, value ] = match;
        results.push({
          original: path.basename(files[index]),
          altered: path.basename(files[index + 1]),
          difference: Number(value)
        });
        index += 1;
      }
    });
    runner.run(commands);
  });
};
