import { fetchSourceFile, saveDocuments } from './download.js';
import { saveDataFromFile, createTables, getDBStatus, getItems } from './db.js';
import { searchFilesByString } from './search.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BLOCKFROST_IPFS } from './blockfrost.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const dbStatus = await getDBStatus();

  createTables();

  if (dbStatus === 'empty') {
    const { fileName } = await fetchSourceFile();
    await saveDataFromFile(fileName);
  }

  const itemsToPersist = await getItems();

  for (const i of itemsToPersist) {
    //@ts-expect-error later
    const files = await searchFilesByString(i.spisova_znacka);

    const filteredFiles = files.filter(file =>
      file ? file.includes('/DokumentOriginal/Index/') : false,
    );

    const filesToDownload = [];

    for await (const file of filteredFiles) {
      if (file) {
        const fileUrl = new URL(file, 'https://vyhledavac.nssoud.cz').toString();
        filesToDownload.push(fileUrl);
      }
    }

    await saveDocuments(filesToDownload);
    const documentsFolder = path.join(__dirname, '../../../data/documents/');

    fs.readdir(documentsFolder, async (err, files) => {
      if (err) console.log(err);

      for await (const file of files) {
        const filePath = path.join(__dirname, '../../../data/documents/', file);
        const ipfsData = await BLOCKFROST_IPFS.add(filePath);
        // @ts-expect-error later
        // send this to denotarius
        console.log({ ...i, ...ipfsData });
      }
    });
  }

  console.log('Done');
})();
