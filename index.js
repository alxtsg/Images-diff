(function(){

  'use strict';

  var ImageDiff = require('./image-diff.js'),

    fs = require('fs'),
    path = require('path'),
    process = require('process'),
    util = require('util'),

    configFilePath = null,

    imagesDirectoryPath = null,

    imageDiff = null,

    differenceTheshold = 0,

    currentDate = null,

    printUsage = function(){
      console.error('Usage: node index.js <config> <images-directory>');
    },

    buildImageFilePath = function(fileName){
      return imagesDirectoryPath + path.sep + fileName;
    },

    parseConfig = null,

    startDiff = null;

  parseConfig = function(){
    fs.readFile(
      configFilePath,
      {
        encoding: 'utf8'
      },
      function(readConfigError, data){
        var config = null;
        if(readConfigError !== null){
          console.error('Unable to read configuration file.');
          console.error(readConfigError);
          process.exit(1);
        }
        try{
          config = JSON.parse(data);
          imageDiff = new ImageDiff({
            gmPath: config.gmPath,
            logPath: config.logPath
          });
          differenceTheshold = parseFloat(config.differenceTheshold);
          process.nextTick(startDiff);
        }catch(parseConfigError){
          console.error('Unable to parse configuration file.');
          console.error(parseConfigError);
          process.exit(1);
        }
      }
    );
  };

  startDiff = function(){
    fs.readdir(imagesDirectoryPath, function(readDirError, files){
      var currentFileIndex = 1;
      if(readDirError !== null){
        console.error('Unable to read images directory.');
        console.error(readDirError);
        process.exit(1);
      }
      if(files.length === 0){
        console.log('The directory contains no images.');
        process.exit(0);
      }
      if(files.length === 1){
        console.log('The directory contains 1 image file only.');
        process.exit(0);
      }
      imageDiff.on('error', function(imageDiffError){
        console.error('Unable to compare images.');
        console.error(imageDiffError);
        process.exit(1);
      });
      imageDiff.on('done', function(difference){
        var message = null;
        if(difference > differenceTheshold){
          message = 'WARN';
        }else{
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
        if(currentFileIndex === files.length){
          currentDate = new Date();
          console.log(util.format(
            'Completed at %s.',
            currentDate.toISOString()
          ));
          process.exit(0);
        }else{
          imageDiff.diff(
            buildImageFilePath(files[currentFileIndex - 1]),
            buildImageFilePath(files[currentFileIndex])
          );
        }
      });
      currentDate = new Date();
      console.log(util.format('Start at %s.', currentDate.toISOString()));
      imageDiff.diff(
        buildImageFilePath(files[currentFileIndex - 1]),
        buildImageFilePath(files[currentFileIndex])
      );
    });
  };

  if(process.argv.length !== 4){
    printUsage();
    process.exit(1);
  }

  configFilePath = process.argv[2];

  imagesDirectoryPath = process.argv[3];

  parseConfig();
}());