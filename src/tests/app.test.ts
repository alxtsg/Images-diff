import assert from 'assert';
import fs from 'fs';
import path from 'path';

import * as app from '../app';

const INPUT_DIR: string = path.join(__dirname, 'data');
const ABNORMAL_IMAGES_DIR: string = path.join(__dirname, 'data', 'abnormal');

const fsPromises = fs.promises;

describe('Main application', async (): Promise<void> => {
  it('can compare images and copy abnormal images', async (): Promise<void> => {
    await assert.doesNotReject(async (): Promise<void> => {
      await app.run(INPUT_DIR);
      const stats: fs.Stats = await fsPromises.stat(ABNORMAL_IMAGES_DIR);
      assert.strictEqual(stats.isDirectory(), true);
      const files: string[] = await fsPromises.readdir(ABNORMAL_IMAGES_DIR);
      assert.strictEqual(files.length, 2);
    });
    await fsPromises.rmdir(ABNORMAL_IMAGES_DIR, { recursive: true });
  });
});
