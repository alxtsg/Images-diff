import assert from 'assert';

import config from '../config';

const DIFF_THRESHOLD = 0.005;
const ABNORMAL_IMAGES_DIRECTORY = 'abnormal';
const CROP_WIDTH = 100;
const CROP_HEIGHT = 100;
const CROP_OFFSET_X = 0;
const CROP_OFFSET_Y = 0;

describe('Configurations module', async () => {
  it('can load configurations', async () => {
    assert.strictEqual(config.diffThreshold, DIFF_THRESHOLD);
    assert.strictEqual(
      config.abnormalImagesDirectory,
      ABNORMAL_IMAGES_DIRECTORY
    );
    assert.strictEqual((config.cropConfig !== null), true);
    assert.strictEqual(config.cropConfig?.width, CROP_WIDTH);
    assert.strictEqual(config.cropConfig?.height, CROP_HEIGHT);
    assert.strictEqual(config.cropConfig?.offsetX, CROP_OFFSET_X);
    assert.strictEqual(config.cropConfig?.offsetY, CROP_OFFSET_Y);
  });
});
