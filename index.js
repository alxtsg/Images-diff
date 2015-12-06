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
    CONFIG_FILE_PATH = path.join(
      __dirname,
      'config.json'
    ),

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
      console.error('Usage: node index.js <images-directory>');
    },

    /**
     * Builds file path.
     *
     * @param {String} fileName Filename.
     *
     * @return {String} Path of file.
     */
    buildImageFilePath = function (fileName) {
      return path.join(
        imagesDirectoryPath,
        fileName
      );
    },

    /**
     * Builds directory path of abnormal images.
     *
     * @return {String} Directory path of abnormal images.
     */
    buildAbnormalImagesDirectoryPath = function () {
      return path.join(
        imagesDirectoryPath,
        abnormalImagesDirectoryName
      );
    },

    /**
     * Builds file path of an abnormal image.
     *
     * @param {String} fileName Filename.
     *
     * @return {String} Path of the abnormal image.
     */
    buildAbnormalImageFilePath = function (fileName) {
      return path.join(
        imagesDirectoryPath,
        abnormalImagesDirectoryName,
        fileName
      );
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
      CONFIG_FILE_PATH,
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
   * Starts computing the differences among images. Given images image0, image1,
   * image2, and image3, differences of the following will be computed:
   *
   * image0 and image1
   * image1 and image2
   * image2 and image3
   */
  startDiff = function () {
    fs.readdir(imagesDirectoryPath, function (readDirError, files) {
      var fullPathFiles = [];
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
      imagesDiff.on('doneAll', function (differences) {
        currentDate = new Date();
        console.log(util.format(
          'Completed at %s.',
          currentDate.toISOString()
        ));
        files.forEach(function (currentFile, index) {
          var previousFile = null,
            difference = null,
            message = null;
          if (index === 0) {
            return;
          }
          difference = differences[index - 1];
          previousFile = files[index - 1];
          if (difference > differenceThreshold) {
            message = 'WARN';
            // Both images are considered as abnormal.
            abnormalImages.push(previousFile);
            abnormalImages.push(currentFile);
          } else {
            message = 'OKAY';
          }
          console.log(util.format(
            '%s, %s: %s, %d',
            previousFile,
            currentFile,
            message,
            difference
          ));
        });
        if ((abnormalImages.length !== 0) &&
          (abnormalImagesDirectoryName !== null)) {
          copyAbnormalImages();
        } else {
          process.exit(0);
        }
      });
      files.forEach(function (file) {
        fullPathFiles.push(buildImageFilePath(file));
      });
      currentDate = new Date();
      console.log(util.format('Start at %s.', currentDate.toISOString()));
      imagesDiff.diffAll(fullPathFiles);
    });
  };

  /**
   * Copies abnormal images to the abnormal images directory.
   */
  copyAbnormalImages = function () {
    var files = [];
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
      files.forEach(function (file, index) {
        var readStream = fs.createReadStream(buildImageFilePath(file)),
          writeStream = fs.createWriteStream(buildAbnormalImageFilePath(file));
        writeStream.on('finish', function () {
          if (index === (files.length - 1)) {
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
  if (process.argv.length !== 3) {
    printUsage();
    process.exit(1);
  }

  imagesDirectoryPath = process.argv[2];

  parseConfig();
}());
