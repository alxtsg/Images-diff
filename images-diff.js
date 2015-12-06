/**
 * Library for finding differences between 2 images.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */
module.exports = (function () {

  'use strict';

  var spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter,
    util = require('util'),

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
    ImagesDiff = function (config) {
      this.gmPath = config.gmPath;
      this.comparisonMetric = 'mse';
      this.comparisonResultRegex = /Total:\ (\d+\.?\d*)/m;
    };

  util.inherits(ImagesDiff, EventEmitter);

  /**
   * Finds differences between 2 images. Emits "error" with error message when
   * unable to compute the differences. Emits "done" with a number (differences
   * of images) when computation is completed.
   *
   * @param {String} imageA Path of an image.
   * @param {String} imageB Path of another image.
   */
  ImagesDiff.prototype.diff = function (imageA, imageB) {
    var self = this,
      commandArguments = [
        'compare',
        '-metric',
        self.comparisonMetric,
        imageA,
        imageB
      ],
      gm = spawn(self.gmPath, commandArguments),
      gmOutput = '',
      normalizedDifference = 0;
    gm.on('error', function (error) {
      self.emit('error', error);
    });
    gm.on('close', function (code) {
      if (code !== 0) {
        self.emit(
          'error',
          util.format('GraphicsMagick exit with code %d.', code)
        );
      } else {
        normalizedDifference = self.comparisonResultRegex.exec(gmOutput);
        if (normalizedDifference === null) {
          self.emit('error', 'Unable to parse GraphicsMagick output.');
        } else {
          self.emit('done', parseFloat(normalizedDifference[1]));
        }
      }
    });
    gm.stdout.on('data', function (data) {
      gmOutput += data;
    });
  };

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
  ImagesDiff.prototype.diffAll = function (images) {
    var self = this,
      commandArguments = [
        'batch',
        '-feedback',
        'on',
        '-'
      ],
      gm = spawn(self.gmPath, commandArguments),
      normalizedDifferences = [],
      batchCommands = [];
    gm.on('error', function (error) {
      self.emit('error', error);
    });
    gm.on('close', function (code) {
      if (code !== 0) {
        self.emit(
          'error',
          util.format('GraphicsMagick exit with code %d.', code)
        );
      } else {
        self.emit('doneAll', normalizedDifferences);
      }
    });
    gm.stdout.on('data', function (data) {
      var output = new Buffer(data, 'utf8').toString(),
        normalizedDifference = self.comparisonResultRegex.exec(output);
      if (normalizedDifference === null) {
        normalizedDifferences.push(null);
      } else {
        normalizedDifferences.push(parseFloat(normalizedDifference[1]));
      }
    });
    // Generate a batch of commands for comparing images.
    images.forEach(function (currentImage, index) {
      var previousImage = null;
      // Skip the first image.
      if (index === 0) {
        return;
      }
      previousImage = images[index - 1];
      batchCommands.push(util.format(
        'compare -metric %s %s %s\n',
        self.comparisonMetric,
        previousImage,
        currentImage
      ));
    });
    gm.stdin.write(batchCommands.join(''));
    gm.stdin.end();
  };

  return ImagesDiff;
}());
