import * as app from './app';

const EXPECTED_ARGS_LENGTH: number = 3;

const printUsage = (): void => {
  const scriptPath = process.argv[1];
  console.error(`Usage: node ${scriptPath} <input-dir>`);
};

const main = async (): Promise<void> => {
  if (process.argv.length !== EXPECTED_ARGS_LENGTH) {
    printUsage();
    return;
  }
  const inputDir: string = process.argv[2];
  await app.run(inputDir);
};

main();
