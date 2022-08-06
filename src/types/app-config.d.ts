import CropConfig from './crop-config';
import Metric from '../metric';

export default interface AppConfig {

  /**
   * ImageMagick binary path.
   */
  magickPath: string;

  /**
   * Comparison metric.
   */
  metric: Metric;

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
