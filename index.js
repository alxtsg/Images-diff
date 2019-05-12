/**
 * Main program.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */

'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');

const CONFIG_FILE = path.join(
  __dirname,
  'config.json'
);

const CROPPED_FILE_A = 'file-a';
const CROPPED_FILE_B = 'file-b';

const COMPARISON_METRIC = 'mse';
const COMPARISON_RESULT_REGEX = /Total: (\d+\.?\d*)/m;

function generateCropImageCommand(originFile, outputFile, cropOption) {
  const width = cropOption.width;
  const height = cropOption.height;
  const offsetX = cropOption.offsetX;
  const offsetY = cropOption.offsetY;
  return [
    'convert',
    `"${originFile}"`,
    '-crop',
    `${width}x${height}+${offsetX}+${offsetY}`,
    `"${outputFile}"`,
    '\n'
  ].join(' ');
}

function generateCompareImagesCommand(fileA, fileB, comparisonMetric) {
  return [
    'compare',
    '-metric',
    comparisonMetric,
    `"${fileA}"`,
    `"${fileB}"`,
    '\n'
  ].join(' ');
}

async function readConfigFile(configFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      configFilePath,
      {
        encoding: 'utf8'
      },
      (readError, data) => {
        if (readError !== null) {
          console.error('Cannot read configuration file.');
          reject(readError);
          return;
        }
        try {
          const config = JSON.parse(data);
          resolve(config);
        } catch (parseError) {
          console.error('Cannot parse configuration file.');
          reject(parseError);
        }
      }
    );
  });
}

async function createTempDirectory() {
  return new Promise((resolve, reject) => {
    const tempDirectory = path.join(os.tmpdir(), path.sep);
    fs.mkdtemp(tempDirectory, (error, directory) => {
      if (error !== null) {
        console.error('Cannot create temporary directory.');
        reject(error);
        return;
      }
      resolve(directory);
    });
  });
}

async function listImages(imagesDirectory) {
  return new Promise((resolve, reject) => {
    fs.readdir(imagesDirectory, (error, files) => {
      if (error !== null) {
        const error =
          new Error('Cannot list images in the specified directory.');
        reject(error);
        return;
      }
      if (files.length === 0) {
        const error = new Error('No images in the specified directory.');
        reject(error);
        return;
      }
      if (files.length === 1) {
        const error = new Error('Only 1 images in the specified directory.');
        reject(error);
        return;
      }
      const fullPathFiles = [];
      files.forEach((file) => {
        fullPathFiles.push(path.join(
          imagesDirectory,
          path.sep,
          file
        ));
      });
      resolve(fullPathFiles);
    });
  });
}

async function runBatchCommands(gmPath, commands) {
  return new Promise((resolve, reject) => {
    const gmBatchArguments = [
      'batch',
      '-'
    ];
    const gm = childProcess.spawn(gmPath, gmBatchArguments);
    const differences = [];
    gm.once('error', (error) => {
      console.error('GraphicsMagick reported an error.');
      reject(error);
    });
    gm.once('close', (code) => {
      if (code !== 0) {
        const error = new Error(`GraphicsMagick exited with code ${code}.`);
        reject(error);
      } else {
        resolve(differences);
      }
    });
    gm.stdout.on('data', (data) => {
      const output = Buffer.from(data, 'utf8').toString();
      const difference = COMPARISON_RESULT_REGEX.exec(output);
      if (difference !== null) {
        differences.push(parseFloat(difference[1]));
      }
    });
    gm.stdin.write(commands.join(''));
    gm.stdin.end();
  });
}

async function deleteCroppedFiles(tempDirectory) {
  const deleteCroppedFileA = new Promise((resolve, reject) => {
    fs.unlink(path.join(tempDirectory, CROPPED_FILE_A), (error) => {
      if (error !== null) {
        console.error('Cannot delete a temporary file.');
        reject(error);
        return;
      }
      resolve();
    });
  });
  const deleteCroppedFileB = new Promise((resolve, reject) => {
    fs.unlink(path.join(tempDirectory, CROPPED_FILE_B), (error) => {
      if (error !== null) {
        console.error('Cannot delete a temporary file.');
        reject(error);
        return;
      }
      resolve();
    });
  });
  return Promise.all([
    deleteCroppedFileA,
    deleteCroppedFileB
  ]);
}

async function deleteTempDirectory(directory) {
  return new Promise((resolve, reject) => {
    fs.rmdir(directory, (error) => {
      if (error !== null) {
        console.error('Cannot delete a temporary directory.');
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function createAbnormalImagesDirectory(directory) {
  return new Promise((resolve, reject) => {
    fs.mkdir(directory, (error) => {
      if (error !== null) {
        console.error('Cannot create abnormal images directory.');
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function copyAbnormalImage(source, destination) {
  return new Promise((resolve, reject) => {
    fs.copyFile(source, destination, (error) => {
      if (error) {
        console.error(`Cannot copy ${source} to ${destination}.`);
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function init() {
  // The 1st argument is the Node.js executable.
  // The 2nd argument is this JavaScript file.
  // The 3rd argument is the images directory.
  if (process.argv.length !== 3) {
    console.error('Usage: node index.js <images-directory>');
    process.exit(1);
  }
  const imagesDirectory = process.argv[2];
  try {
    const config = await readConfigFile(CONFIG_FILE);
    const tempDirectory = await createTempDirectory();
    const images = await listImages(imagesDirectory);
    const batchCommands = [];
    let prevFile = null;
    let currFile = null;
    let prevCropFile = null;
    let currCropFile = null;
    // Generate a batch of commands to be executed by GraphicsMagick.
    images.forEach((image, index) => {
      // Swapping the previous and current cropped image files, so I don't have
      // to crop the same image file twice.
      if (index === 0) {
        // Defining the name of current cropped image file is not necessary when
        // processing the first image file, because it will be treated as
        // previous image file.
        prevCropFile = path.join(tempDirectory, CROPPED_FILE_B);
      } else if ((index % 2) === 0) {
        prevCropFile = path.join(tempDirectory, CROPPED_FILE_A);
        currCropFile = path.join(tempDirectory, CROPPED_FILE_B);
      } else {
        prevCropFile = path.join(tempDirectory, CROPPED_FILE_B);
        currCropFile = path.join(tempDirectory, CROPPED_FILE_A);
      }
      // Special handling of first image file, treat it as previous image file.
      if (index === 0) {
        prevFile = image;
        // Crop the image only if the option is specified.
        if (config.crop !== null) {
          batchCommands.push(generateCropImageCommand(
            prevFile,
            prevCropFile,
            config.crop
          ));
        }
        return;
      }
      currFile = image;
      // Crop the image only if the option is specified.
      // This also affects which files will be used for comparison.
      if (config.crop !== null) {
        batchCommands.push(generateCropImageCommand(
          currFile,
          currCropFile,
          config.crop
        ));
        batchCommands.push(generateCompareImagesCommand(
          prevCropFile,
          currCropFile,
          COMPARISON_METRIC
        ));
      } else {
        batchCommands.push(generateCompareImagesCommand(
          prevFile,
          currFile,
          COMPARISON_METRIC
        ));
      }
      prevFile = currFile;
      prevCropFile = currCropFile;
    });
    console.log(`Start comparing images at ${(new Date()).toISOString()}.`);
    const differences = await runBatchCommands(config.gmPath, batchCommands);
    console.log(`Completed comparing images at ${(new Date()).toISOString()}.`);
    // The number of comparisons should be the number of images minus 1.
    const expectedComparisons = (images.length - 1);
    if (differences.length !== expectedComparisons) {
      console.error(`Unexpected ${differences.length} image comparisons.`);
      process.exit(1);
    }
    // Clean up, delete temporary directory.
    if (config.crop !== null) {
      await deleteCroppedFiles(tempDirectory);
    }
    await deleteTempDirectory(tempDirectory);
    const abnormalImages = new Set();
    images.forEach((currImage, index) => {
      if (index === 0) {
        return;
      }
      const prevImage = images[index - 1];
      const difference = differences[index - 1];
      let message = null;
      if (difference > config.differenceThreshold) {
        message = 'WARN';
        // Both images are considered as abnormal.
        abnormalImages.add(prevImage);
        abnormalImages.add(currImage);
      } else {
        message = 'OKAY';
      }
      console.log(`${prevImage}, ${currImage}, ${difference}: ${message}.`);
    });
    if (abnormalImages.size === 0) {
      console.log('No abnormal images have been found.');
      return;
    }
    if (config.abnormalImagesDirectory === null) {
      console.log('Not copying abnormal images.');
      return;
    }
    const abnormalImagesDirectory =
      path.join(imagesDirectory, config.abnormalImagesDirectory);
    await createAbnormalImagesDirectory(abnormalImagesDirectory);
    // Cannot use "forEach" here because all abnormal images will be copied at
    // once, some (slow) systems may not be able to copy over 1000 files at the
    // same time.
    console.log(`Start copying images at ${(new Date().toISOString())}.`);
    for (let image of abnormalImages) {
      await copyAbnormalImage(
        image,
        path.join(abnormalImagesDirectory, path.basename(image))
      );
    }
    console.log(`Completed copying images at ${(new Date().toISOString())}.`);
  } catch (error) {
    console.error(error.message);
  }
}

init();
