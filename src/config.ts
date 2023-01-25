import dotenv from 'dotenv';

import path from 'path';

import Metric from './metric';

import type AppConfig from './types/app-config';

const ENV_FILE = path.join(__dirname, '.env');

const config: AppConfig = {
  magickPath: '',
  ffmpegPath: '',
  metric: Metric.MSE,
  diffThreshold: 0,
  abnormalImagesDirectory: null,
  cropConfig: null
};

const loadConfig = (): void => {
  const result = dotenv.config({
    path: ENV_FILE
  });
  if (result.error) {
    console.error(result.error);
    throw new Error(`Unable to load configuration file.`);
  }
  const envConfig = process.env;
  if (envConfig.MAGICK_PATH) {
    config.magickPath = envConfig.MAGICK_PATH;
  }
  if (envConfig.FFMPEG_PATH) {
    config.ffmpegPath = envConfig.FFMPEG_PATH;
  }
  if (!Number.isFinite(Number(envConfig.DIFF_THRESHOLD))) {
    throw new Error('Invalid images difference threshold.');
  }
  config.diffThreshold = Number(envConfig.DIFF_THRESHOLD);
  const selectedMetric = envConfig.METRIC as Metric;
  if (!Object.values(Metric).includes(selectedMetric)) {
    throw new Error('Invalid comparison metric.');
  }
  config.metric = selectedMetric;
  if ((config.metric === Metric.MSE) && !config.magickPath) {
    throw new Error('Missing ImageMagick path.');
  }
  if ((config.metric === Metric.SSIM) && !config.ffmpegPath) {
    throw new Error('Missing FFmpeg path.');
  }
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
      !Number.isInteger(cropOffsetY) ||
      (cropOffsetX < 0) ||
      (cropOffsetY < 0)) {
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
