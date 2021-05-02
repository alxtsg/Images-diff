import assert from 'assert';

import config from '../config';

const DIFF_THRESHOLD: number = 0.005;
const ABNORMAL_IMAGES_DIRECTORY: string = 'abnormal';
const CROP_WIDTH: number = 100;
const CROP_HEIGHT: number = 100;
const CROP_OFFSET_X: number = 0;
const CROP_OFFSET_Y: number = 0;

describe('Configurations module', async (): Promise<void> => {
  it('can load configurations', async (): Promise<void> => {
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
