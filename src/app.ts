import fsPromises from 'fs/promises';
import path from 'path';

import ComparisonResult from './types/comparison-result';
import config from './config';
import * as fsUtils from './fs-utils';
import * as imageUtils from './image-utils';

import type ComparisonPair from './types/comparison-pair';

/**
 * Gets the pairs of files to be compared.
 *
 * @param files Files to be compared.
 *
 * @returns Comparison pairs.
 */
export const getComparisonPairs = (files: string[]): ComparisonPair[] => {
  return files.map((file, index) => {
      if (index === 0) {
        return null;
      }
      return {
        original: files[index - 1],
        altered: file
      };
    })
    .filter((pair): pair is ComparisonPair => (pair !== null));
};

/**
 * Runs the application.
 *
 * @param inputDir The directory which contains images to be compared.
 */
export const run = async (inputDir: string): Promise<void> => {
  const start = Date.now();
  const images = await fsUtils.getFiles(inputDir);
  const imagePairs = getComparisonPairs(images);
  const anomalies: Set<string> = new Set();
  for (const pair of imagePairs) {
    const result = await imageUtils.compareImages(pair.original, pair.altered);
    const { original, altered, difference } = result;
    if (difference < config.diffThreshold) {
      console.log(`[OKAY] ${original}, ${altered}: ${difference}`);
    } else {
      anomalies.add(original);
      anomalies.add(altered);
      console.log(`[WARN] ${original}, ${altered}: ${difference}`);
    }
  }
  if (config.abnormalImagesDirectory !== null) {
    const outputDir = path.join(inputDir, config.abnormalImagesDirectory);
    await fsPromises.mkdir(outputDir);
    for (const anomaly of anomalies) {
      await fsPromises.copyFile(
        anomaly,
        path.join(outputDir, path.basename(anomaly))
      )
    }
  }
  const end = Date.now();
  console.log(`Completed in ${(end - start)}ms.`);
};
