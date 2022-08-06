import assert from 'assert';

import config from '../config';

describe('Configurations module', async () => {
  it('can load configurations', async () => {
    assert(config.magickPath.length > 0);
    assert(config.metric.length > 0);
    assert(config.diffThreshold > 0);
    if (config.abnormalImagesDirectory) {
      assert(config.abnormalImagesDirectory.length > 0);
    }
    if (config.cropConfig) {
      assert(config.cropConfig.width > 0);
      assert(config.cropConfig.height > 0);
      assert(config.cropConfig.offsetX >= 0);
      assert(config.cropConfig.offsetY >= 0);
    }
  });
});
