import colors from 'ansi-colors';
import cliProgress from 'cli-progress';
import { createWriteStream } from 'fs';
import got from 'got';
import download from 'download';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadBar = new cliProgress.SingleBar({
  format: 'Downloading |' + colors.cyan('{bar}') + '| {percentage}%',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
});

export const fetchSourceFile = (): Promise<{ fileName: string }> =>
  new Promise((resolve, reject): void => {
    downloadBar.start(100, 0);

    const fileName = path.join(__dirname, '../../../data/nssoud.cz/nssoud.xlsx');
    const downloadStream = got.stream(config.xmlSourceFile);
    const fileWriterStream = createWriteStream(fileName);

    downloadStream
      .on('downloadProgress', ({ percent }) => {
        const percentage = Math.round(percent * 100);
        downloadBar.update(percentage);
      })
      .on('error', error => {
        downloadBar.stop();
        console.error(`Download failed: ${error.message}`);
      });

    fileWriterStream
      .on('error', error => {
        reject(`Could not write file to system: ${error.message}`);
      })
      .on('finish', () => {
        downloadBar.stop();
        console.log(`File downloaded to: ${fileName}`);
        resolve({ fileName });
      });

    downloadStream.pipe(fileWriterStream);
  });

export const saveDocuments = async (fileList: string[]) => {
  await Promise.all(
    fileList.map(url => download(url, path.join(__dirname, '../../../data/documents'))),
  );
};
