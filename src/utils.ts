import crypto from 'crypto';

export const sha256 = (stringToHash: string) =>
  crypto.createHash('sha256').update(stringToHash, 'utf8').digest('hex');
