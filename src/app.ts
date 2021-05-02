import fs from 'fs';
import path from 'path';

import ComparisonResult from './types/comparison-result';
import config from './config';
import * as fsUtils from './fs-utils';
import * as imageUtils from './image-utils';

const fsPromises = fs.promises;

export const run = async (inputDir: string): Promise<void> => {
  let images: string[] = await fsUtils.getFiles(inputDir);
  let tempDir: string | null = '';
  if (config.cropConfig !== null) {
    tempDir = await fsUtils.createTempDirectory();
    await imageUtils.cropImages(config.cropConfig, tempDir, images);
    images = await fsUtils.getFiles(tempDir);
  }
  const results: ComparisonResult[] = await imageUtils.compareImages(images);
  const anomalies: Set<string> = new Set();
  results.forEach((result) => {
    const { original, altered, difference } = result;
    if (difference < config.diffThreshold) {
      console.log(`${original}, ${altered}: ${difference} [OKAY]`);
    } else {
      anomalies.add(original);
      anomalies.add(altered);
      console.log(`${original}, ${altered}: ${difference} [WARN]`);
    }
  });
  if (config.abnormalImagesDirectory !== null) {
    const outputDir: string = path.join(inputDir, config.abnormalImagesDirectory);
    await fsPromises.mkdir(outputDir);
    const abnormalImages: string[] = [];
    anomalies.forEach((file) => {
      abnormalImages.push(path.join(inputDir, file));
    });
    for (const imageFile of abnormalImages) {
      await fsPromises.copyFile(
        imageFile,
        path.join(outputDir, path.basename(imageFile))
      );
    }
  }
  if (tempDir !== null) {
    await fsPromises.rmdir(tempDir, { recursive: true });
  }
};
