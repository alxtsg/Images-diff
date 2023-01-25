import assert from 'assert';
import path from 'path';

import * as fsUtils from '../fs-utils';
import * as imageUtils from '../image-utils';

import type ComparisonResult from '../types/comparison-result';

const IMAGES_DIR = path.join(__dirname, 'data');

describe('Image utilities', async function() {
  this.timeout(10000);

  it('can compare images', async () => {
    const files = await fsUtils.getFiles(IMAGES_DIR);
    await assert.doesNotReject(async () => {
      const results: ComparisonResult[] = [];
      for (let i = 0; i < files.length; i += 1) {
        if (i === 0) {
          continue;
        }
        const original = files[i - 1];
        const altered = files[i];
        const result = await imageUtils.compareImages(original, altered);
        results.push(result);
      }
      assert.strictEqual(results.length, (files.length - 1));
      const anomalies = results.filter((result) => result.isAbnormal);
      assert.strictEqual(anomalies.length, 1);
    });
  });

  it('can compare images in batch', async () => {
    const files = await fsUtils.getFiles(IMAGES_DIR);
    await assert.doesNotReject(async () => {
      const results = await imageUtils.compareImageBatch(files);
      assert.strictEqual(results.length, (files.length - 1));
      const anomalies = results.filter((result) => result.isAbnormal);
      assert.strictEqual(anomalies.length, 1);
    });
  });
});
