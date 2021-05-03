import fs from 'fs';
import os from 'os';
import path from 'path';

const WINDOWS_PLATFORM: string = 'win32';
const ENV_FILE: string = path.join(__dirname, '..', '.env');
const COMMON_ENV_CONTENT: string[] = [
  'DIFF_THRESHOLD=0.005',
  'ABNORMAL_IMAGES_DIRECTORY=abnormal',
  'CROP_WIDTH=100',
  'CROP_HEIGHT=100',
  'CROP_OFFSET_X=0',
  'CROP_OFFSET_Y=0'
];
const UNIX_ENV_CONTENT: string = [
  'GM_PATH=gm',
  ...COMMON_ENV_CONTENT
].join('\n');
const WINDOWS_ENV_CONTENT: string = [
  'GM_PATH=C:\\Program Files\\GraphicsMagick-1.3.36-Q8\\gm.exe',
  ...COMMON_ENV_CONTENT
].join('\n');

const fsPromises = fs.promises;

const main = async () => {
  let content: string | null = null;
  if (os.platform() === WINDOWS_PLATFORM) {
    content = WINDOWS_ENV_CONTENT;
  } else {
    content = UNIX_ENV_CONTENT;
  }
  await fsPromises.writeFile(ENV_FILE, content)
};

main();
