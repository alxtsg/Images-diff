import CropConfig from './crop-config';

export default interface AppConfig {

  /**
   * GraphicsMagick executable path.
   */
  gmPath: string;

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
