/**
 * Main program.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const path = require('path');
const process = require('process');
const util = require('util');

const ImagesDiff = require('./images-diff.js');
const Copier = require('./copier.js');

const EVENT_ERROR_READ_CONFIG = 'EVENT_ERROR_READ_CONFIG';
const EVENT_ERROR_PARSE_CONFIG = 'EVENT_ERROR_PARSE_CONFIG';
const EVENT_ERROR_READ_IMAGES_DIR = 'EVENT_ERROR_READ_IMAGES_DIR';
const EVENT_ERROR_NO_IMAGES = 'EVENT_ERROR_NO_IMAGES';
const EVENT_ERROR_ONE_IMAGE = 'EVENT_ERROR_ONE_IMAGE';
const EVENT_ERROR_IMAGEDIFF_ERROR = 'EVENT_ERROR_IMAGEDIFF_ERROR';
const EVENT_ERROR_CREATE_ABNORMAL_IMAGES_DIR =
  'EVENT_ERROR_CREATE_ABNORMAL_IMAGES_DIR';
const EVENT_APPLICATION_READY = 'EVENT_APPLICATION_READY';
const EVENT_DIFF_COMPLETE = 'EVENT_DIFF_COMPLETE';
const EVENT_COPY_ABNORMAL_IMAGES_DONE = 'EVENT_COPY_ABNORMAL_IMAGES_DONE';

// Configuration file path.
const CONFIG_FILE_PATH = path.join(
  __dirname,
  'config.json'
);

/**
 * Main application.
 *
 * @extends EventEmitter
 */
class Application extends EventEmitter {

  /**
   * Constructor.
   *
   * @class
   * @constructor
   *
   * @param {String} imagesDirectoryPath Path of directory containing images
   *                                     for comparison.
   */
  constructor(imagesDirectoryPath) {
    super();
    this.imagesDiff = null;
    this.differenceThreshold = null;
    this.imagesDirectoryPath = imagesDirectoryPath;
    this.abnormalImagesDirectoryName = null;
    this.abnormalImages = [];
  }

  /**
   * Builds file path.
   *
   * @param {String} fileName Filename.
   *
   * @return {String} Path of file.
   */
  buildImageFilePath(fileName) {
    return path.join(
      this.imagesDirectoryPath,
      fileName
    );
  }

  /**
   * Builds directory path of abnormal images.
   *
   * @return {String} Directory path of abnormal images.
   */
  buildAbnormalImagesDirectoryPath() {
    return path.join(
      this.imagesDirectoryPath,
      this.abnormalImagesDirectoryName
    );
  }

  /**
   * Builds file path of an abnormal image.
   *
   * @param {String} fileName Filename.
   *
   * @return {String} Path of the abnormal image.
   */
  buildAbnormalImageFilePath(fileName) {
    return path.join(
      this.imagesDirectoryPath,
      this.abnormalImagesDirectoryName,
      fileName
    );
  }

  /**
   * Parses configuration files.
   */
  parseConfig() {
    fs.readFile(
      CONFIG_FILE_PATH,
      {
        encoding: 'utf8'
      },
      (readConfigError, data) => {
        if (readConfigError !== null) {
          this.emit(EVENT_ERROR_READ_CONFIG, readConfigError);
          return;
        }
        try {
          const config = JSON.parse(data);
          this.imagesDiff = new ImagesDiff({
            gmPath: config.gmPath
          });
          this.differenceThreshold = parseFloat(config.differenceThreshold);
          if ((config.abnormalImagesDirectoryName !== undefined) &&
            (config.abnormalImagesDirectoryName !== null)) {
            this.abnormalImagesDirectoryName =
              config.abnormalImagesDirectoryName;
          }
          this.emit(EVENT_APPLICATION_READY);
        } catch (parseConfigError) {
          this.emit(EVENT_ERROR_PARSE_CONFIG, parseConfigError);
        }
      }
    );
  }

  /**
   * Computes the differences among images. Given images image0, image1,
   * image2, and image3, differences of the following will be computed:
   *
   * image0 and image1
   * image1 and image2
   * image2 and image3
   */
  diffImages() {
    fs.readdir(this.imagesDirectoryPath, (readDirError, files) => {
      const fullPathFiles = [];
      if (readDirError !== null) {
        this.emit(EVENT_ERROR_READ_IMAGES_DIR, readDirError);
        return;
      }
      if (files.length === 0) {
        this.emit(EVENT_ERROR_NO_IMAGES);
        return;
      }
      if (files.length === 1) {
        this.emit(EVENT_ERROR_ONE_IMAGE);
        return;
      }
      this.imagesDiff.on('error', (imagesDiffError) => {
        this.emit(EVENT_ERROR_IMAGEDIFF_ERROR, imagesDiffError);
      });
      this.imagesDiff.on('doneAll', (differences) => {
        console.log(util.format(
          'Completed at %s.',
          (new Date()).toISOString()
        ));
        files.forEach((currentFile, index) => {
          let previousFile = null;
          let difference = null;
          let message = null;
          if (index === 0) {
            return;
          }
          difference = differences[index - 1];
          previousFile = files[index - 1];
          if (difference > this.differenceThreshold) {
            message = 'WARN';
            // Both images are considered as abnormal.
            if (this.abnormalImages.indexOf(previousFile) < 0) {
              this.abnormalImages.push(previousFile);
            }
            if (this.abnormalImages.indexOf(currentFile) < 0) {
              this.abnormalImages.push(currentFile);
            }
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
        this.emit(EVENT_DIFF_COMPLETE);
      });
      files.forEach((file) => {
        fullPathFiles.push(this.buildImageFilePath(file));
      });
      console.log(util.format('Start at %s.', (new Date()).toISOString()));
      this.imagesDiff.diffAll(fullPathFiles);
    });
  }

  /**
   * Copies abnormal images to the abnormal images directory.
   */
  copyAbnormalImages() {
    // Copy abnormal image files.
    console.log(util.format('Copy start at %s.', (new Date()).toISOString()));
    fs.mkdir(this.buildAbnormalImagesDirectoryPath(), (mkdirError) => {
      if (mkdirError !== null) {
        this.emit(EVENT_ERROR_CREATE_ABNORMAL_IMAGES_DIR, mkdirError);
        return;
      }
      let index = 0;
      const copier = new Copier();
      copier.on('done', () => {
        if (index === (this.abnormalImages.length - 1)) {
          console.log(util.format(
            'Copy completed at %s.',
            (new Date()).toISOString())
          );
          this.emit(EVENT_COPY_ABNORMAL_IMAGES_DONE);
        }
        index += 1;
        copier.copy(
          this.buildImageFilePath(this.abnormalImages[index]),
          this.buildAbnormalImageFilePath(this.abnormalImages[index])
        );
      });
      copier.copy(
        this.buildImageFilePath(this.abnormalImages[index]),
        this.buildAbnormalImageFilePath(this.abnormalImages[index])
      );
    });
  }
}

/**
 * Prints program usage.
 */
const printUsage = function printUsage() {
  console.error('Usage: node index.js <images-directory>');
};

// Expect 3 arguments.
if (process.argv.length !== 3) {
  printUsage();
  process.exit(1);
}

const application = new Application(process.argv[2]);
application.on(EVENT_ERROR_READ_CONFIG, (error) => {
  console.error('Unable to read configuration file.');
  console.error(error);
  process.exit(1);
})
.on(EVENT_ERROR_PARSE_CONFIG, (error) => {
  console.error('Unable to parse configuration file.');
  console.error(error);
  process.exit(1);
})
.on(EVENT_ERROR_READ_IMAGES_DIR, (error) => {
  console.error('Unable to read images directory.');
  console.error(error);
  process.exit(1);
})
.on(EVENT_ERROR_NO_IMAGES, () => {
  console.log('The directory contains no images.');
  process.exit(0);
})
.on(EVENT_ERROR_ONE_IMAGE, () => {
  console.log('The directory contains 1 image file only.');
  process.exit(0);
})
.on(EVENT_ERROR_IMAGEDIFF_ERROR, (error) => {
  console.error('Unable to compare images.');
  console.error(error);
  process.exit(1);
})
.on(EVENT_ERROR_CREATE_ABNORMAL_IMAGES_DIR, (error) => {
  console.error('Unable to create directory for abnormal images.');
  console.error(error);
  process.exit(1);
})
.on(EVENT_APPLICATION_READY, () => {
  application.diffImages();
})
.on(EVENT_DIFF_COMPLETE, () => {
  if (application.abnormalImages.length === 0) {
    process.exit(0);
  }
  if (application.abnormalImagesDirectoryName === null) {
    process.exit(0);
  }
  application.copyAbnormalImages();
})
.on(EVENT_COPY_ABNORMAL_IMAGES_DONE, () => {
  process.exit(0);
});
application.parseConfig();
