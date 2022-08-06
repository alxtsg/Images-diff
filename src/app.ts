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
  const results = await imageUtils.compareImageBatch(images);
  results.forEach((result) => {
    const { original, altered, difference, isAbnormal } = result;
    if (isAbnormal) {
      anomalies.add(original);
      anomalies.add(altered);
      console.log(`[WARN] ${original}, ${altered}: ${difference}`);
    } else {
      console.log(`[OKAY] ${original}, ${altered}: ${difference}`);
    }
  });
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
