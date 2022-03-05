import assert from 'assert';
import path from 'path';

import * as app from '../app';
import * as fsUtils from '../fs-utils';
import * as imageUtils from '../image-utils';

import type ComparisonResult from '../types/comparison-result';

const IMAGES_DIR = path.join(__dirname, 'data');

describe('Image utilities', async () => {
  it('can compare images', async () => {
    const files = await fsUtils.getFiles(IMAGES_DIR);
    const pairs = app.getComparisonPairs(files);
    await assert.doesNotReject(async () => {
      const results: ComparisonResult[] = [];
      for (const pair of pairs) {
        const { original, altered } = pair;
        const result = await imageUtils.compareImages(original, altered);
        results.push(result);
      }
      assert.strictEqual(results.length, (files.length - 1));
      const anomalies = results.filter((results) => (results.difference > 0));
      assert.strictEqual(anomalies.length, 1);
    });
  });
});
