import CropConfig from './crop-config';

export default interface AppConfig {

  /**
   * ImageMagick binary path.
   */
  magickPath: string;

  /**
   * Images difference threshold.
   */
  diffThreshold: number;

  /**
   * Directory of abnormal images.
   */
  abnormalImagesDirectory: string | null;

  /**
   * Image cropping configurations.
   */
  cropConfig: CropConfig | null;
}
