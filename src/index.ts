import fs from 'fs';
import got from 'got';
import path from 'path';
import { fileURLToPath } from 'url';

import { BLOCKFROST_IPFS, lucid } from './utils.js';
import { createTables, getDBStatus, getItems, saveDataFromFile, saveQueueItem } from './db.js';
import { fetchSourceFile, saveDocuments } from './download.js';
import { RequestBody } from './types.js';
import { searchFilesByString } from './search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const dbStatus = await getDBStatus();

    const seedPhrase = 'all all all all all all all all all all all all';
    lucid.selectWalletFromSeed(seedPhrase);

    createTables();

    if (dbStatus === 'empty') {
      const { fileName } = await fetchSourceFile();
      await saveDataFromFile(fileName);
    }

    const itemsToPersist = await getItems();
    const bodyToSend: RequestBody = { ipfs: [], pin_ipfs: true };

    for (const i of itemsToPersist) {
      const files = await searchFilesByString(i.nsssoud_spisova_znacka);

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

          bodyToSend.ipfs.push({
            cid: ipfsData.ipfs_hash,
            metadata: [
              i.nsssoud_spisova_znacka,
              i.nsssoud_soudce,
              i.nsssoud_typ_veci,
              i.nsssoud_typ_rizeni,
              i.nsssoud_doslo,
            ],
          });
        }
      });

      if (bodyToSend.ipfs.length > 0) {
        const body = JSON.stringify(bodyToSend);
        try {
          const response: { payment: { address: string } } = await got
            .post('http://0.0.0.0:3000/attestation/submit', {
              body,
              headers: {
                'Content-Type': 'application/json',
              },
            })
            .json();

          const tx = await lucid
            .newTx()
            .payToAddress(response.payment.address, { lovelace: 10000000n })
            .complete();

          const signedTx = await tx.sign().complete();
          const txHash = await signedTx.submit();

          await saveQueueItem({ hash: i.hash, state: 'ok', txHash });
        } catch (e) {
          await saveQueueItem({ hash: i.hash, state: 'error' });
        }
      }
    }

    console.log('Done');
  } catch (e) {
    console.log(e);
  }
})();
