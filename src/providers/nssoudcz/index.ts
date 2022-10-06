import path from 'path';
import { fileURLToPath } from 'url';
import got from 'got';
import { v4 as uuidv4 } from 'uuid';
import fs, { createWriteStream } from 'fs';
import cliProgress from 'cli-progress';
import config from './config.js';
import colors from 'ansi-colors';
import xlsx from 'xlsx';

// download

const downloadBar = new cliProgress.SingleBar({
  format: 'Downloading |' + colors.cyan('{bar}') + '| {percentage}%',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

downloadBar.start(100, 0);

const fileName = path.join(__dirname, '../../../data/nssoud.cz/nssoud.xlsx');
const downloadStream = got.stream(config.fileListUrl);
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
    console.error(`Could not write file to system: ${error.message}`);
  })
  .on('finish', () => {
    downloadBar.stop();
    console.log(`File downloaded to ${fileName}`);
    processData();
  });

downloadStream.pipe(fileWriterStream);

// process

const processData = () => {
  console.log('Processing the data ...');
  const workbook = xlsx.readFile(fileName);
  const sheet_name_list = workbook.SheetNames;
  const xlData = xlsx.utils.sheet_to_json<{ 'Spisová značka': string; uuid: string }>(
    workbook.Sheets[sheet_name_list[0]],
  );

  const thingsToSearch: unknown[] = [];

  for (const row of xlData) {
    thingsToSearch.push({ ...row, id: uuidv4() });
  }

  fs.writeFile(
    path.join(__dirname, '../../../data/nssoud.cz/serach-data.json'),
    JSON.stringify(thingsToSearch),
    'utf8',
    error => {
      if (error) {
        console.error(`Could not write file to system: ${error.message}`);
      }
      console.log('OK');
    },
  );
};
