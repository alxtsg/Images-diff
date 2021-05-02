export default interface CropConfig {
  /**
   * Width of cropped image.
   */
  width: number;

  /**
   * Height of cropped image.
   */
  height: number;

  /**
   * Offset from left of the image.
   */
  offsetX: number;

  /**
   * Offset from the top of the image.
   */
  offsetY: number;
}
