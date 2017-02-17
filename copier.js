/**
 * Module for copying file.
 *
 * @author Alex Tsang <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */

'use strict';

const fs = require('fs');
const EventEmitter = require('events').EventEmitter;

class Copier extends EventEmitter {

  /**
   * Copies from source file to destination file.
   *
   * @param {string} sourceFile Path of source file.
   * @param {string} destinationFile Path of destination file.
   */
  copy(sourceFile, destinationFile) {
    const readStream = fs.createReadStream(sourceFile);
    const writeStream = fs.createWriteStream(destinationFile);
    writeStream.on('finish', () => {
      this.emit('done');
    });
    readStream.pipe(writeStream);
  }
}

module.exports = Copier;
