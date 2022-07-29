import fsPromises from 'fs/promises';
import path from 'path';

const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_CONTENT = [
  'MAGICK_PATH=magick',
  'DIFF_THRESHOLD=0.99',
  'ABNORMAL_IMAGES_DIRECTORY=abnormal',
  'CROP_WIDTH=100',
  'CROP_HEIGHT=100',
  'CROP_OFFSET_X=0',
  'CROP_OFFSET_Y=0'
].join('\n');

const main = async () => {
  await fsPromises.writeFile(ENV_FILE, ENV_CONTENT)
};

main();
