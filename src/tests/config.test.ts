import assert from 'assert';

import config from '../config';
import Metric from '../metric';

describe('Configurations module', async () => {
  it('can load ImageMagick binary path', function() {
    if (config.metric !== Metric.MSE) {
      this.skip();
      return;
    }

    assert(config.magickPath.length > 0);
  });

  it('can load FFmpeg binary path', function() {
    if (config.metric !== Metric.SSIM) {
      this.skip();
      return;
    }

    assert(config.ffmpegPath.length > 0);
  });

  it('can load abnormal images directory', function() {
    if (!config.abnormalImagesDirectory) {
      this.skip();
      return;
    }

    assert(config.abnormalImagesDirectory.length > 0);
  });

  it('can load cropping configurations', function() {
    if (!config.cropConfig) {
      this.skip();
      return;
    }

    assert(config.cropConfig.width > 0);
    assert(config.cropConfig.height > 0);
    assert(config.cropConfig.offsetX >= 0);
    assert(config.cropConfig.offsetY >= 0);
  });

  it('can load common configurations', async () => {
    assert(config.metric.length > 0);
    assert(config.diffThreshold > 0);
  });
});
