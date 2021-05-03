import assert from 'assert';
import fs from 'fs';

import * as fsUtils from '../fs-utils';

const fsPromises = fs.promises;

describe('Filesystem utilities', async () => {
  it('can create temporary directory', async () => {
    await assert.doesNotReject(async () => {
      const directory: string = await fsUtils.createTempDirectory();
      const status: fs.Stats = await fsPromises.stat(directory);
      assert.strictEqual(status.isDirectory(), true);
      await fsPromises.rmdir(directory, { recursive: true });
    });
  });

  it('can get absolute paths of files of a directory', async () => {
    const directory = __dirname;
    await assert.doesNotReject(async () => {
      const files: string[] = await fsUtils.getFiles(directory);
      assert.strictEqual((files.length > 0), true);
      for (const file of files) {
        assert.strictEqual(file.startsWith(directory), true);
      }
    });
  });
});
