import fsPromises from 'fs/promises';
import path from 'path';

/**
 * Gets absolute paths of files under the specified directory.
 *
 * @param directory Target directory.
 *
 * @returns A Promise resolves with an array of paths of files.
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
