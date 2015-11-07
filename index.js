/**
 * Main program.
 *
 * @author Alex Tsang <alextsang@live.com>
 */
(function () {

  'use strict';

  var ImagesDiff = require('./images-diff.js'),

    fs = require('fs'),
    path = require('path'),
    process = require('process'),
    util = require('util'),

    // Configuration file path.
    configFilePath = null,

    // Images directory path.
    imagesDirectoryPath = null,

    // ImagesDiff instance.
    imagesDiff = null,

    // Differences threshold.
    differenceThreshold = 0,

    // Current date.
    currentDate = null,

    // An array of paths of abnormal images.
    abnormalImages = [],

    // Directory name of abnormal images.
    abnormalImagesDirectoryName = null,

    /**
     * Prints program usage.
     */
    printUsage = function () {
      console.error('Usage: node index.js <config> <images-directory>');
    },

    /**
     * Builds file path.
     *
     * @param {String} fileName Filename.
     *
     * @return {String} Path of file.
     */
    buildImageFilePath = function (fileName) {
      return imagesDirectoryPath + path.sep + fileName;
    },

    /**
     * Builds directory path of abnormal images.
     *
     * @return {String} Directory path of abnormal images.
     */
    buildAbnormalImagesDirectoryPath = function () {
      return imagesDirectoryPath +
        path.sep +
        abnormalImagesDirectoryName;
    },

    /**
     * Builds file path of an abnormal image.
     *
     * @param {String} fileName Filename.
     *
     * @return {String} Path of the abnormal image.
     */
    buildAbnormalImageFilePath = function (fileName) {
      return imagesDirectoryPath +
        path.sep +
        abnormalImagesDirectoryName +
        path.sep +
        fileName;
    },

    // Placeholders of functions.
    parseConfig = null,
    startDiff = null,
    copyAbnormalImages = null;

  /**
   * Parses configuration file.
   */
  parseConfig = function () {
    fs.readFile(
      configFilePath,
      {
        encoding: 'utf8'
      },
      function (readConfigError, data) {
        var config = null;
        if (readConfigError !== null) {
          console.error('Unable to read configuration file.');
          console.error(readConfigError);
          process.exit(1);
        }
        try {
          config = JSON.parse(data);
          imagesDiff = new ImagesDiff({
            gmPath: config.gmPath,
            logPath: config.logPath
          });
          differenceThreshold = parseFloat(config.differenceThreshold);
          if ((config.abnormalImagesDirectoryName !== undefined) ||
            (config.abnormalImagesDirectoryName !== null)) {
            abnormalImagesDirectoryName = config.abnormalImagesDirectoryName;
          }
          process.nextTick(startDiff);
        } catch (parseConfigError) {
          console.error('Unable to parse configuration file.');
          console.error(parseConfigError);
          process.exit(1);
        }
      }
    );
  };

  /**
   * Starts computing the differences among images. Given images A0, A1, A2 and
   * A3, differences of A0 and A1, A1 and A2, A2 and A3 will be computed.
   */
  startDiff = function () {
    fs.readdir(imagesDirectoryPath, function (readDirError, files) {
      var currentFileIndex = 1;
      if (readDirError !== null) {
        console.error('Unable to read images directory.');
        console.error(readDirError);
        process.exit(1);
      }
      if (files.length === 0) {
        console.log('The directory contains no images.');
        process.exit(0);
      }
      if (files.length === 1) {
        console.log('The directory contains 1 image file only.');
        process.exit(0);
      }
      imagesDiff.on('error', function (imagesDiffError) {
        console.error('Unable to compare images.');
        console.error(imagesDiffError);
        process.exit(1);
      });
      imagesDiff.on('done', function (difference) {
        var message = null;
        if (difference > differenceThreshold) {
          message = 'WARN';
          // Both images are considered as abnormal.
          abnormalImages.push(files[currentFileIndex - 1]);
          abnormalImages.push(files[currentFileIndex]);
        } else {
          message = 'OKAY';
        }
        console.log(util.format(
          '%s, %s: %s, %d',
          files[currentFileIndex - 1],
          files[currentFileIndex],
          message,
          difference
        ));
        currentFileIndex += 1;
        if (currentFileIndex === files.length) {
          currentDate = new Date();
          console.log(util.format(
            'Completed at %s.',
            currentDate.toISOString()
          ));
          if ((abnormalImages.length !== 0) &&
            (abnormalImagesDirectoryName !== null)) {
            copyAbnormalImages();
          } else {
            process.exit(0);
          }
        } else {
          imagesDiff.diff(
            buildImageFilePath(files[currentFileIndex - 1]),
            buildImageFilePath(files[currentFileIndex])
          );
        }
      });
      currentDate = new Date();
      console.log(util.format('Start at %s.', currentDate.toISOString()));
      imagesDiff.diff(
        buildImageFilePath(files[currentFileIndex - 1]),
        buildImageFilePath(files[currentFileIndex])
      );
    });
  };

  /**
   * Copies abnormal images to the abnormal images directory.
   */
  copyAbnormalImages = function () {
    var files = [],
      copiedFiles = 0;
    // Filter duplicated files.
    abnormalImages.forEach(function (abnormalImage) {
      if (files.indexOf(abnormalImage) < 0) {
        files.push(abnormalImage);
      }
    });
    // Copy abnormal image files.
    currentDate = new Date();
    console.log(util.format('Copy start at %s.', currentDate.toISOString()));
    fs.mkdir(buildAbnormalImagesDirectoryPath(), function (mkdirError) {
      if (mkdirError !== null) {
        console.error('Unable to create directory for abnormal images.');
        console.error(mkdirError);
        process.exit(1);
      }
      files.forEach(function (file) {
        var readStream = fs.createReadStream(buildImageFilePath(file)),
          writeStream = fs.createWriteStream(buildAbnormalImageFilePath(file));
        writeStream.on('finish', function () {
          copiedFiles += 1;
          if (copiedFiles === files.length) {
            currentDate = new Date();
            console.log(util.format(
              'Copy completed at %s.',
              currentDate.toISOString()
            ));
            process.exit(0);
          }
        });
        readStream.pipe(writeStream);
      });
    });
  };

  // 4 arguments are expected.
  if (process.argv.length !== 4) {
    printUsage();
    process.exit(1);
  }

  configFilePath = process.argv[2];

  imagesDirectoryPath = process.argv[3];

  parseConfig();
}());
