/**
 * Module for copying file.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */
module.exports = (function () {

  'use strict';

  const fs = require('fs'),
    EventEmitter = require('events').EventEmitter;

  class Copier extends EventEmitter {

    /**
     * Constructor.
     *
     * @class
     * @constructor
     */
    constructor () {
      super();
    }

    /**
     * Copies from source file to destination file.
     *
     * @param {string} sourceFile Path of source file.
     * @param {string} destinationFile Path of destination file.
     */
    copy (sourceFile, destinationFile) {
      let readStream = fs.createReadStream(sourceFile),
        writeStream = fs.createWriteStream(destinationFile);
      writeStream.on('finish', () => {
        this.emit('done');
      });
      readStream.pipe(writeStream);
    }
  }

  return Copier;
}());
