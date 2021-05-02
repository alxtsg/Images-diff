import childProcess from 'child_process';
import path from 'path';

import ComparisonResult from './types/comparison-result';
import config from './config';
import CropConfig from './types/crop-config';

const COMPARISON_METRIC: string = 'mse';
const COMPARISON_RESULT_REGEX: RegExp = /Total: (\d+\.?\d*)/gm;

const runBatchCommands = async (commands: string[]): Promise<string> => {
  const batchArguments = [
    'batch',
    '-'
  ];
  return new Promise((resolve, reject) => {
    const gm = childProcess.spawn(config.gmPath, batchArguments);
    let gmOutput: string[] = [];
    gm.once('error', (error) => {
      console.error('GraphicsMagick reported an error.');
      reject(error);
    });
    gm.once('close', (code) => {
      if (code !== 0) {
        const error = new Error(`GraphicsMagick exited with code ${code}.`);
        reject(error);
        return;
      }
      resolve(gmOutput.join(''));
    });
    gm.stdout.on('data', (data) => {
      gmOutput.push(Buffer.from(data, 'utf8').toString());
    });
    gm.stdin.write(commands.join(''));
    gm.stdin.end();
  });
};

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
  await runBatchCommands(commands);
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
  const output = await runBatchCommands(commands);
  const matches = output.matchAll(COMPARISON_RESULT_REGEX);
  const results: ComparisonResult[] = [];
  let index: number = 0;
  for (const match of matches) {
    const [ _, value ] = match;
    results.push({
      original: path.basename(files[index]),
      altered: path.basename(files[index + 1]),
      difference: Number(value)
    });
    index += 1;
  }
  return results;
};
