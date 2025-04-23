export default interface ComparisonResult {
  /**
   * The filename of the original image.
   */
  original: string;

  /**
   * The filename of the altered image.
   */
  altered: string;

  /**
   * Difference between the original image and the altered image.
   */
  difference: number | null;

  /**
   * Whether the difference is beyond threshold and considered abnormal.
   */
  isAbnormal: boolean;
}
