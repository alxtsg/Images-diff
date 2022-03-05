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
   * Differences between the original image and the altered image.
   */
  difference: number;
}
