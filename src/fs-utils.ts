import fs from 'fs';
import os from 'os';
import path from 'path';

const fsPromises = fs.promises;

/**
 * Creates a temporary directory.
 *
 * @returns Resolves with the path of the temporary directory.
 */
export const createTempDirectory = async (): Promise<string> => {
  try {
    const basePath: string = path.join(os.tmpdir(), path.sep);
    const directory = await fsPromises.mkdtemp(basePath);
    return directory;
  } catch (error) {
    console.error('Unable to create temporary directory.');
    throw error;
  }
};

/**
 * Gets absolute paths of files under the specified directory.
 *
 * @param directory Target directory.
 *
 * @returns Resolves with an array of paths of files.
 */
export const getFiles = async (directory: string): Promise<string[]> => {
  try {
    const files = await fsPromises.readdir(directory);
    return files.map((file) => path.join(directory, file));
  } catch (error) {
    console.error(`Unable to get files under ${directory}.`);
    throw error;
  }
};
