import crypto from 'crypto';

export const sha256 = (stringTohash: string) =>
  crypto.createHash('sha256').update(stringTohash, 'utf8').digest('hex');
