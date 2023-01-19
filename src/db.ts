import xlsx from 'xlsx';
import sqlite3 from 'sqlite3';
import { DBJusticeDecisionRow, DBQueueRowInput, DBStatusResponse } from './types.js';
import { sha256 } from './utils.js';

export const db = new sqlite3.Database('./database.db');

export const getDBStatus = async (): Promise<DBStatusResponse> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT count(*) as count FROM justice_decisions', (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result.count === 0 ? 'empty' : 'ok');
    });
  });
};

export const getItems = async (): Promise<DBJusticeDecisionRow[]> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM justice_decisions ORDER BY random() limit 5', (error, result) => {
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
          queue(
            hash TEXT UNIQUE,
            state TEXT,
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
  const xlData = xlsx.utils.sheet_to_json<Record<string, never>>(workbook.Sheets[sheetNameList[0]]);
  const thingsToSearch: unknown[] = [];
  const filterResults = ['Nerozhodnuto'];

  for (const row of xlData) {
    const decision = row['Typ rozhodnutí'];

    if (!filterResults.includes(decision)) {
      const stringToHash = `${row['Spisová značka']}-${row['Soudce']}-${row['Typ věci']}-${row['Typ řízení']}-${row['Došlo']}}`;

      thingsToSearch.push([
        sha256(stringToHash),
        row['Spisová značka'],
        row['Soudce'],
        row['Typ věci'],
        row['Typ řízení'],
        row['Došlo'],
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

export const saveQueueItem = async (input: DBQueueRowInput) => {
  db.run(
    `INSERT INTO queue(hash, state, transaction_hash) VALUES(?, ?, ?)`,
    [input.hash, input.state, input.txHash],
    err => {
      if (err) {
        return console.log(err.message);
      }
    },
  );
};
