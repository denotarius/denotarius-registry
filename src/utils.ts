import { BlockFrostIPFS } from '@blockfrost/blockfrost-js';
import crypto from 'crypto';
import { Blockfrost, Lucid } from 'lucid-cardano';

export const BLOCKFROST_IPFS = new BlockFrostIPFS({
  projectId: 'ipfsqwMez5XOuDzzio6ZQkpSjApKe4RpAwfi',
});

export const sha256 = (stringToHash: string) =>
  crypto.createHash('sha256').update(stringToHash, 'utf8').digest('hex');

export const lucid = await Lucid.new(
  new Blockfrost(
    'https://cardano-preview.blockfrost.io/api/v0',
    'previewS3XpcDGrTMYUNFOhJPeSos2RRAkNW5XN',
  ),
  'Preview',
);
