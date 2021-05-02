export default interface ComparisonResult {
  /**
   * The original image.
   */
  original: string;

  /**
   * The altered image.
   */
  altered: string;

  /**
   * Differences.
   */
  difference: number;
}
