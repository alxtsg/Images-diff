import assert from 'assert';
import fs from 'fs';
import path from 'path';

import ComparisonResult from '../types/comparison-result';
import CropConfig from '../types/crop-config';
import * as fsUtils from '../fs-utils';
import * as imageUtils from '../image-utils';

const IMAGES_DIR: string = path.join(__dirname, 'data');
const CROP_CONFIG: CropConfig = {
  width: 100,
  height: 100,
  offsetX: 0,
  offsetY: 0
};

const fsPromises = fs.promises;

describe('Image utilities', async () => {
  it('can crop images', async () => {
    const files: string[] = await fsUtils.getFiles(IMAGES_DIR);
    const outputDir: string = await fsUtils.createTempDirectory();
    await assert.doesNotReject(async () => {
      await imageUtils.cropImages(CROP_CONFIG, outputDir, files);
      const croppedFiles: string[] = await fsUtils.getFiles(outputDir);
      assert.strictEqual(croppedFiles.length, files.length);
    });
    await fsPromises.rmdir(outputDir, { recursive: true });
  });

  it('can compare images', async () => {
    const files: string[] = await fsUtils.getFiles(IMAGES_DIR);
    const outputDir: string = await fsUtils.createTempDirectory();
    await imageUtils.cropImages(CROP_CONFIG, outputDir, files);
    const croppedImages: string[] = await fsUtils.getFiles(outputDir);
    await assert.doesNotReject(async () => {
      const results: ComparisonResult[] = await imageUtils.compareImages(croppedImages);
      assert.strictEqual(results.length, (files.length - 1));
      const filteredResults: ComparisonResult[] = results.filter((results) => (results.difference > 0));
      assert.strictEqual(filteredResults.length, 1);
    });
    await fsPromises.rmdir(outputDir, { recursive: true });
  });
});
