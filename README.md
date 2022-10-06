<a href="https://fivebinaries.com/"><img src="https://img.shields.io/badge/made%20by-Five%20Binaries-darkviolet.svg?style=flat-square" /></a>

## Denotarius.io backend service

Denotarius is a simple service that is record some data on-chain forever. A simple notary. The user sends a list of documents, is prompter to pay, after paying this is recorded on chain.

#### HOW TO RUN

dev testnet: `yarn dev-testnet`

dev mainnet: `yarn dev-mainnet`

production: `yarn start`

#### CONFIGURATION

You can find configuration files in `config/` folder.

```json
{
  "server": {
    "port": 3000,
    "debug": false,
    "prometheusMetrics": false
  },
  "db": {
    "connectionString": "postgresql://localhost/postgres",
    "maxConnections": 2,
    "connectionTimeoutMs": 3000,
    "idleTimeoutMs": 10000,
    "ssl": false
  },
  "blockfrost": {
    "apiKey": "testnetD3t6mMoXwpxtRA3xdVZY93XvP0JPdSTiH",
    "ipfsKey": "ipfsqwMez5XOuDzzio6ZQxkpSjApKe4RpAwfi"
  },
  "amountToPayInLovelaces": 100000000,
  "mnemonic": "all all all all all all all all all all all all",
  "metadataLabel": 69
}

```

#### DATABASE SCHEMA

```sql
CREATE TABLE IF NOT EXISTS batch (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  status TEXT NOT NULL,
  amount BIGINT NOT NULL,
  address TEXT NOT NULL,
  address_index BIGINT NOT NULL,
  order_time_limit_in_seconds INT NOT NULL,
  pin_ipfs BOOL DEFAULT FALSE NOT NULL,
  tx_hash TEXT
)
 
CREATE TABLE IF NOT EXISTS document (
  batch_id UUID,
  ipfs_hash TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY(batch_id) REFERENCES batch(uuid)
)
```
