import assert from 'assert';

import * as fsUtils from '../fs-utils';

describe('Filesystem utilities', async () => {
  it('can get absolute paths of files of a directory', async () => {
    const directory = __dirname;
    await assert.doesNotReject(async () => {
      const files = await fsUtils.getFiles(directory);
      assert.strictEqual((files.length > 0), true);
      for (const file of files) {
        assert.strictEqual(file.startsWith(directory), true);
      }
    });
  });
});
