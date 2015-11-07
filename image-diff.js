/**
 * Library for finding differences between 2 images.
 *
 * @author Alex Tsang <alextsang@live.com>
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
    ImageDiff = function (config) {
      this.gmPath = config.gmPath;
      this.comparisonMetric = 'mse';
      this.comparisonResultRegex = /Total: (\d+\.?\d*)/m;
    };

  util.inherits(ImageDiff, EventEmitter);

  /**
   * Finds differences between 2 images. Emits "error" with error message when
   * unable to compute the differences. Emits "done" with a number (differences
   * of images) when computation is completed.
   *
   * @param {String} imageA Path of an image.
   * @param {String} imageB Path of another image.
   */
  ImageDiff.prototype.diff = function (imageA, imageB) {
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

  return ImageDiff;
}());
