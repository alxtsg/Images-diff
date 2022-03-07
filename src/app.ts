import fsPromises from 'fs/promises';
import path from 'path';

import config from './config';
import * as fsUtils from './fs-utils';
import * as imageUtils from './image-utils';

/**
 * Runs the application.
 *
 * @param inputDir The directory which contains images to be compared.
 */
export const run = async (inputDir: string): Promise<void> => {
  const start = Date.now();
  const images = await fsUtils.getFiles(inputDir);
  const anomalies: Set<string> = new Set();
  for (let i = 0; i < images.length; i += 1) {
    if (i === 0) {
      continue;
    }
    const result = await imageUtils.compareImages(images[i - 1], images[i]);
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
