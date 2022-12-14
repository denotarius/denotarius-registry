import xlsx from 'xlsx';
import sqlite3 from 'sqlite3';

import { sha256 } from '../../utils.js';

export const db = new sqlite3.Database('./database.db');

export const getDBStatus = async (): Promise<'ok' | 'empty'> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT count(*) as count FROM justice_decisions', (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result.count === 0 ? 'empty' : 'ok');
    });
  });
};

export const getItems = async (): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM justice_decisions limit 10', (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  });
};

export const createTables = async () => {
  const createTableJustice = () =>
    new Promise((resolve, reject) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS justice_decisions(
          hash TEXT UNIQUE,
          nsssoud_spisova_znacka TEXT,
          nsssoud_soudce TEXT,
          nsssoud_typ_veci TEXT,
          nsssoud_typ_rizeni TEXT,
          nsssoud_doslo TEXT
        )`,
        error => (error ? reject(error) : resolve(true)),
      );
    });

  const createTableDocs = () =>
    new Promise((resolve, reject) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS 
          documents(
            hash TEXT UNIQUE,
            name TEXT,
            ipfs_hash TEXT,
            transaction_hash TEXT,
            FOREIGN KEY(hash) REFERENCES justice_decisions(hash)
          )`,
        error => (error ? reject(error) : resolve(true)),
      );
    });

  await createTableJustice();
  await createTableDocs();
};

export const saveDataFromFile = async (fileName: string) => {
  const workbook = xlsx.readFile(fileName);
  const sheetNameList = workbook.SheetNames;
  const xlData = xlsx.utils.sheet_to_json<Record<any, any>>(workbook.Sheets[sheetNameList[0]]);
  const thingsToSearch: unknown[] = [];
  const filterResults = ['Nerozhodnuto'];

  for (const row of xlData) {
    const decision = row['Typ rozhodnut??'];

    if (!filterResults.includes(decision)) {
      const stringToHash = `${row['Spisov?? zna??ka']}-${row['Soudce']}-${row['Typ v??ci']}-${row['Typ ????zen??']}-${row['Do??lo']}}`;

      thingsToSearch.push([
        sha256(stringToHash),
        row['Spisov?? zna??ka'],
        row['Soudce'],
        row['Typ v??ci'],
        row['Typ ????zen??'],
        row['Do??lo'],
      ]);
    }
  }

  const decisionQuery = `INSERT INTO 
    justice_decisions (
      hash,
      nsssoud_spisova_znacka,
      nsssoud_soudce,
      nsssoud_typ_veci,
      nsssoud_typ_rizeni,
      nsssoud_doslo
    )
    VALUES (?, ?, ? ,?, ?, ?)`;

  const statement = db.prepare(decisionQuery);

  for (let i = 0; i < thingsToSearch.length; i++) {
    statement.run(thingsToSearch[i], function (err) {
      if (err) throw err;
    });
  }

  statement.finalize();
};
