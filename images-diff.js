/**
 * Library for finding differences between 2 images.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */
module.exports = (function () {

  'use strict';

  const spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter,
    util = require('util');

  class ImagesDiff extends EventEmitter {

    /**
     * Constructor.
     *
     * @class
     * @constructor
     *
     * @param {Object} config Configuration in form of JSON object. Expected
     *                        properties:
     *                        gmPath: Path of GraphicsMagick.
     */
    constructor (config) {
      super();
      this.gmPath = config.gmPath;
      this.comparisonMetric = 'mse';
      this.comparisonResultRegex = /Total:\ (\d+\.?\d*)/m;
    }

    /**
     * Finds differences between 2 images. Emits "error" with error message when
     * unable to compute the differences. Emits "done" with a number
     * (differences of images) when computation is completed.
     *
     * @param {String} imageA Path of an image.
     * @param {String} imageB Path of another image.
     */
    diff (imageA, imageB) {
      let commandArguments = [
          'compare',
          '-metric',
          this.comparisonMetric,
          imageA,
          imageB
        ],
        gm = spawn(this.gmPath, commandArguments),
        gmOutput = '',
        normalizedDifference = 0;
      gm.on('error', () => {
        this.emit('error', error);
      });
      gm.on('close', (code) => {
        if (code !== 0) {
          this.emit(
            'error',
            util.format('GraphicsMagick exit with code %d.', code)
          );
        } else {
          normalizedDifference = this.comparisonResultRegex.exec(gmOutput);
          if (normalizedDifference === null) {
            this.emit('error', 'Unable to parse GraphicsMagick output.');
          } else {
            this.emit('done', parseFloat(normalizedDifference[1]));
          }
        }
      });
      gm.stdout.on('data', (data) => {
        gmOutput += data;
      });
    }

    /**
     * Finds differences among images in sequence. Given image0, image1, image2
     * and image3, the differences of the following will be computed:
     *
     * image0 and image1
     * image1 and image2
     * image2 and image3
     *
     * Emits "error" with error message when unable to compute the differences.
     * Emits "doneAll" with an array of numbers (differences among images) when
     * computation is completed.
     *
     * @param {Array} images Paths of images.
     */
    diffAll (images) {
      let commandArguments = [
          'batch',
          '-feedback',
          'on',
          '-'
        ],
        gm = spawn(this.gmPath, commandArguments),
        normalizedDifferences = [],
        batchCommands = [];
      gm.on('error', (error) => {
        this.emit('error', error);
      });
      gm.on('close', (code) => {
        if (code !== 0) {
          this.emit(
            'error',
            util.format('GraphicsMagick exit with code %d.', code)
          );
        } else {
          this.emit('doneAll', normalizedDifferences);
        }
      });
      gm.stdout.on('data', (data) => {
        let output = new Buffer(data, 'utf8').toString(),
          normalizedDifference = this.comparisonResultRegex.exec(output);
        if (normalizedDifference === null) {
          normalizedDifferences.push(null);
        } else {
          normalizedDifferences.push(parseFloat(normalizedDifference[1]));
        }
      });
      // Generate a batch of commands for comparing images.
      images.forEach((currentImage, index) => {
        let previousImage = null;
        // Skip the first image.
        if (index === 0) {
          return;
        }
        previousImage = images[index - 1];
        batchCommands.push(util.format(
          'compare -metric %s %s %s\n',
          this.comparisonMetric,
          previousImage,
          currentImage
        ));
      });
      gm.stdin.write(batchCommands.join(''));
      gm.stdin.end();
    }
  }

  return ImagesDiff;
}());
