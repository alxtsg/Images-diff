import dotenv from 'dotenv';

import path from 'path';

import AppConfig from './types/app-config';

const ENV_FILE: string = path.join(__dirname, '.env');

const config: AppConfig = {
  gmPath: '',
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
  config.gmPath = envConfig.GM_PATH;
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
    if (!Number.isInteger(Number(envConfig.CROP_WIDTH)) ||
    !Number.isInteger(Number(envConfig.CROP_HEIGHT)) ||
    !Number.isInteger(Number(envConfig.CROP_OFFSET_X)) ||
    !Number.isInteger(Number(envConfig.CROP_OFFSET_Y))) {
      throw new Error('Invalid crop configurations.');
    }
    config.cropConfig = {
      width: Number(envConfig.CROP_WIDTH),
      height: Number(envConfig.CROP_HEIGHT),
      offsetX: Number(envConfig.CROP_OFFSET_X),
      offsetY: Number(envConfig.CROP_OFFSET_Y)
    };
  }
};

loadConfig();

export default config;
