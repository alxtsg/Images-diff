import assert from 'assert';
import fs from 'fs';
import path from 'path';

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

describe('Image utilities', async (): Promise<void> => {
  it('can crop images', async (): Promise<void> => {
    const files: string[] = await fsUtils.getFiles(IMAGES_DIR);
    const outputDir: string = await fsUtils.createTempDirectory();
    await assert.doesNotReject(async (): Promise<void> => {
      await imageUtils.cropImages(CROP_CONFIG, outputDir, files);
      const croppedFiles: string[] = await fsUtils.getFiles(outputDir);
      assert.strictEqual(croppedFiles.length, files.length);
    });
    await fsPromises.rmdir(outputDir, { recursive: true });
  });
});
