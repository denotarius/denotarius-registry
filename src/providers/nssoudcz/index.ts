import { fetchSourceFile } from './download.js';
import { saveDataFromFile, createTables, getDBStatus } from './db.js';
import { searchFilesByString } from './search.js';
import { BLOCKFROST_IPFS } from './blockfrost.js';

(async () => {
  const dbStatus = await getDBStatus();

  createTables();

  if (dbStatus === 'empty') {
    const { fileName } = await fetchSourceFile();
    await saveDataFromFile(fileName);
  }

  const files = await searchFilesByString('Vol 13/2022');

  const filteredFiles = files.filter(file =>
    file ? file.includes('/DokumentOriginal/Index/') : false,
  );

  for await (const file of filteredFiles) {
    if (file) {
      // const fileUrl = new URL(file, 'https://vyhledavac.nssoud.cz').toString();
      // const file = fs.createWriteStream(path.join('./', file));

      const ipfsHash = await BLOCKFROST_IPFS.add(
        './providers/nssoudcz/15Af 120-2017_20210317120059.pdf',
      );
      console.log('ipfsHash', ipfsHash);
    }
  }

  console.log('Done');
})();
