import { fetchSourceFile, saveDocuments } from './download.js';
import { saveDataFromFile, createTables, getDBStatus, getItems } from './db.js';
import { searchFilesByString } from './search.js';
import path from 'path';
import fs from 'fs';
import { Lucid, Blockfrost } from 'lucid-cardano';
import { fileURLToPath } from 'url';
import { BLOCKFROST_IPFS } from './blockfrost.js';
import got from 'got';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const dbStatus = await getDBStatus();
    const lucid = await Lucid.new(
      new Blockfrost(
        'https://cardano-preview.blockfrost.io/api/v0',
        'previewS3XpcDGrTMYUNFOhJPeSos2RRAkNW5XN',
      ),
      'Preview',
    );

    const seedPhrase = 'all all all all all all all all all all all all';
    lucid.selectWalletFromSeed(seedPhrase);

    createTables();

    if (dbStatus === 'empty') {
      const { fileName } = await fetchSourceFile();
      await saveDataFromFile(fileName);
    }

    const itemsToPersist = await getItems();
    const result: Record<any, any> = {};
    const bodyToSend: any = { ipfs: [], pin_ipfs: true };

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

      // @ts-expect-error later
      result[i.hash] = [];

      fs.readdir(documentsFolder, async (err, files) => {
        if (err) console.log(err);

        for await (const file of files) {
          const filePath = path.join(__dirname, '../../../data/documents/', file);
          const ipfsData = await BLOCKFROST_IPFS.add(filePath);

          bodyToSend.ipfs.push({
            cid: ipfsData.ipfs_hash,
            metadata: {
              // @ts-expect-error later
              nsssoud_spisova_znacka: i.nsssoud_spisova_znacka,
            },
          });
        }
      });

      if (bodyToSend.ipfs.length > 0) {
        const response: any = await got
          .post('http://0.0.0.0:3000/attestation/submit', {
            body: JSON.stringify(bodyToSend),
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

        console.log(response, txHash);
      }
    }

    console.log('Done');
  } catch (e) {
    console.log(e);
  }
})();
