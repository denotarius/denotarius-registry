import path from 'path';
import { fileURLToPath } from 'url';
import got from 'got';
import { sha256 } from '../../utils.js';
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
const searchDataFileName = path.join(__dirname, '../../../data/nssoud.cz/serach-data.json');
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
    console.log(`File downloaded to: ${fileName}`);
    processData();
  });

downloadStream.pipe(fileWriterStream);

// process

const processData = () => {
  console.log('Processing the data...');

  const workbook = xlsx.readFile(fileName);
  const sheetNameList = workbook.SheetNames;
  const xlData = xlsx.utils.sheet_to_json<Record<any, any>>(workbook.Sheets[sheetNameList[0]]);
  const thingsToSearch: unknown[] = [];
  const filterResults = ['Nerozhodnuto'];

  for (const row of xlData) {
    const decision = row['Typ rozhodnutí'];

    if (!filterResults.includes(decision)) {
      const stringToHash = `${row['Spisová značka']}-${row['Soudce']}-${row['Typ věci']}-${row['Typ řízení']}-${row['Došlo']}}`;

      thingsToSearch.push({
        ...row,
        hash: sha256(stringToHash),
      });
    }
  }

  fs.writeFile(searchDataFileName, JSON.stringify(thingsToSearch), 'utf8', error => {
    if (error) {
      console.error(`Could not write file to system: ${error.message}`);
    }
    console.log(`File saved to: ${searchDataFileName}`);
  });
};
