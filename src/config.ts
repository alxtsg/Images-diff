import dotenv from 'dotenv';

import path from 'path';

import type AppConfig from './types/app-config';

const ENV_FILE = path.join(__dirname, '.env');

const config: AppConfig = {
  magickPath: '',
  diffThreshold: 0,
  abnormalImagesDirectory: null,
  cropConfig: null
};

const loadConfig = (): void => {
  const result = dotenv.config({
    path: ENV_FILE
  });
  if (result.error !== undefined) {
    throw new Error(`Unable to read .env: ${result.error.message}`);
  }
  if (result.parsed === undefined) {
    throw new Error('No parsed configurations.');
  }
  const envConfig = result.parsed;
  config.magickPath = envConfig.MAGICK_PATH;
  if (!Number.isFinite(Number(envConfig.DIFF_THRESHOLD))) {
    throw new Error('Invalid images difference threshold.');
  }
  config.diffThreshold = Number(envConfig.DIFF_THRESHOLD);
  if (envConfig.ABNORMAL_IMAGES_DIRECTORY) {
    config.abnormalImagesDirectory = envConfig.ABNORMAL_IMAGES_DIRECTORY;
  }
  if (envConfig.CROP_WIDTH &&
    envConfig.CROP_HEIGHT &&
    envConfig.CROP_OFFSET_X &&
    envConfig.CROP_OFFSET_Y) {
    const cropWidth = Number(envConfig.CROP_WIDTH);
    const cropHeihght = Number(envConfig.CROP_HEIGHT);
    const cropOffsetX = Number(envConfig.CROP_OFFSET_X);
    const cropOffsetY = Number(envConfig.CROP_OFFSET_Y);
    if (!Number.isInteger(cropWidth) ||
      !Number.isInteger(cropHeihght) ||
      !Number.isInteger(cropOffsetX) ||
      !Number.isInteger(cropOffsetY)) {
      throw new Error('Invalid crop configurations.');
    }
    config.cropConfig = {
      width: cropWidth,
      height: cropHeihght,
      offsetX: cropOffsetX,
      offsetY: cropOffsetY
    };
  }
};

loadConfig();

export default config;
