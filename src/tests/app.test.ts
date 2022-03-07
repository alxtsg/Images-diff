import assert from 'assert';
import fsPromises from 'fs/promises';
import path from 'path';

import * as app from '../app';

const INPUT_DIR = path.join(__dirname, 'data');
const ABNORMAL_IMAGES_DIR = path.join(__dirname, 'data', 'abnormal');

describe('Main application', async () => {
  it('can compare images and copy abnormal images', async () => {
    await assert.doesNotReject(async () => {
      await app.run(INPUT_DIR);
      const stats = await fsPromises.stat(ABNORMAL_IMAGES_DIR);
      assert.strictEqual(stats.isDirectory(), true);
      const files = await fsPromises.readdir(ABNORMAL_IMAGES_DIR);
      const expectedAnomalies = 2;
      assert.strictEqual(files.length, expectedAnomalies);
    });
    await fsPromises.rm(ABNORMAL_IMAGES_DIR, { recursive: true });
  });
});
