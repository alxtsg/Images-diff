import childProcess from 'child_process';
import EventEmitter from 'events';

import config from './config';

export default class GMBatchCommandRunner extends EventEmitter {
  static EVENT_ERROR: string = 'error';
  static EVENT_DATA: string = 'data';
  static EVENT_DONE: string = 'done';

  run(commands: string[]): void {
    const batchArguments = [
      'batch',
      '-'
    ];
    const gm = childProcess.spawn(config.gmPath, batchArguments);
      gm.once('error', (error) => {
        console.error('GraphicsMagick reported an error.');
        this.emit('error', error);
      });
      gm.once('close', (code) => {
        if (code !== 0) {
          const error = new Error(`GraphicsMagick exited with code ${code}.`);
          this.emit('error', error);
          return;
        }
        this.emit('done');
      });
      gm.stdout.on('data', (data) => {
        this.emit('data', Buffer.from(data, 'utf8').toString());
      });
      gm.stdin.write(commands.join(''));
      gm.stdin.end();
  }
};
