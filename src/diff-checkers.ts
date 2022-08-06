import config from './config';
import Metric from './metric';

interface DiffChecker {
  (diff: number): boolean
}

/**
 * Checks if the difference is beyond the MSE threshold.
 *
 * @param diff Difference of compared images.
 *
 * @returns True if the difference is beyond threshold, false otherwise.
 */
const isBeyondMseThreshold: DiffChecker = (diff: number): boolean => {
  return (diff >= config.diffThreshold);
}

/**
 * Checks if the difference is beyond the SSIM threshold.
 *
 * @param diff Difference of compared images.
 *
 * @returns True if the difference is beyond threshold, false otherwise.
 */
const isBeyondSsimThreshold: DiffChecker = (diff: number): boolean => {
  return (diff < config.diffThreshold);
}

const diffCheckers: Map<Metric, DiffChecker> = new Map([
  [Metric.MSE, isBeyondMseThreshold],
  [Metric.SSIM, isBeyondSsimThreshold]
]);

export default diffCheckers;
