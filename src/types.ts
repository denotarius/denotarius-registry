export interface DBJusticeDecisionRow {
  hash: string;
  nsssoud_spisova_znacka: string;
  nsssoud_soudce: string;
  nsssoud_typ_veci: string;
  nsssoud_typ_rizeni: string;
  nsssoud_doslo: string;
}

export interface DBQueueRowInput {
  hash: string;
  state: 'ok' | 'error';
  txHash?: string;
}

export type DBStatusResponse = 'ok' | 'empty';

export interface RequestBody {
  ipfs: IPFSData[];
  pin_ipfs: boolean;
}

interface IPFSData {
  cid: string;
  metadata: string[];
}
