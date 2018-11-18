# TurtlePay™ Blockchain Cache API

#### Master Build Status
[![Build Status](https://travis-ci.org/TurtlePay/blockchain-cache-api.svg?branch=master)](https://travis-ci.org/TurtlePay/blockchain-cache-api) [![Build status](https://ci.appveyor.com/api/projects/status/github/TurtlePay/blockchain-cache-api?branch=master&svg=true)](https://ci.appveyor.com/project/brandonlehmann/blockchain-cache-api/branch/master)

## Prerequisites

* [TurtlePay: Blockchain Data Collection Agent](https://github.com/TurtlePay/blockchain-data-collection-agent)
* [Node.js](https://nodejs.org/) LTS

## Foreword

We know that this documentation needs cleaned up and made easier to read. We'll compile it as part of the full documentation as the project works forward.

## Setup

1) Clone this repository to wherever you'd like the API to run:

```bash
git clone https://github.com/TurtlePay/blockchain-cache-api
```

2) Install the required Node.js modules

```bash
cd blockchain-cache-api && npm install
```

3) Use your favorite text editor to change the values as necessary in `config.js`

**Note:** Make sure you use a read-only database user for security reasons

```javascript
{
  "mysql": {
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "password": "password",
    "database": "turtlecoin",
    "connectionLimit": 10
  },
  "bindIp": "0.0.0.0",
  "httpPort": 80,
  "corsHeader": "*"
}
```

4) Fire up the script

```bash
node index.js
```

5) Optionally, install PM2 or another process manager to keep the service running.

```bash
npm install -g pm2@latest
pm2 startup
pm2 start index.js --name blockchain-cache-api -i max
pm2 save
```

## API

This package provides the following HTTP RESTful API methods:

### GET Methods

|Path|Description|Response|
|---|---|---|
|/height|Returns the cache current height|```{"height": 857860}```|
|/block/count|Returns the total number of blocks in the cache|```{"blockCount":857860}```|
|/block/*#hash#*|Returns the block information for the block with the specified hash|See [Example Response](#block)|
|/block/*#height#*|Returns the block information for the block with the specified height|See [Example Response](#block)|
|/block/header/*#hash#*|Returns the block header for the block with the specified hash|See [Example Response](#blockheader)|
|/block/header/*#height#*|Returns the block header for the block with the specified height|See [Example Response](#blockheader)|
|/block/header/top|Returns the top block header|See [Example Response](#blockheadertop)|
|/block/headers/*#height#*|Returns details regarding the 30 blocks preceeding the specified block including the specified block|See [Example Response](#blockheadersheight)|
|/transaction/pool|Returns the transactions currently in the mempool|See [Example Response](#transactionpool)|
|/transaction/*#hash#*|Returns details regarding the transaction with the specified hash|See [Example Response](#transaction)|
|/transaction/*#hash#*/inputs|Returns the transcations inputs for the transaction with the specified hash|See [Example Response](#transactioninputs)|
|/transaction/*#hash#*/outputs|Returns the transcations outputs for the transaction with the specified hash|See [Example Response](#transactionoutputs)|
|/transactions/*#paymentId#*|Returns the transcations hashes all transactions with the specified paymentId|See [Example Response](#transactions)|

### POST Methods

|Path|Description|Parameters|Response|
|---|---|---|---|
|/sync|Returns all the necessary information for a wallet to discover which outputs belong to it|```{"lastKnownBlockHashes":[...],"blockCount":100}``` See [Note](#post-payload)|See [Example Response](#response)|

### Example Responses

#### /block/#

```javascript
{
  "hash": "dd40ba6a33e7c6ff84927d510881e285eba9a17cbde43da587aa6cc41883b852",
  "prevHash": "51fa759a944875ff000ad68a3d5e77fea38ba9c3c01fa3ec7d3391cdf4441277",
  "height": 50000,
  "baseReward": 2975794,
  "difficulty": 154653,
  "majorVersion": 3,
  "minorVersion": 0,
  "nonce": 33060,
  "size": 419,
  "timestamp": 1514341632,
  "alreadyGeneratedCoins": 148903595706,
  "alreadyGeneratedTransactions": 60897,
  "reward": 2975794,
  "sizeMedian": 300,
  "totalFeeAmount": 0,
  "transactionsCumulativeSize": 300,
  "transactionCount": 1,
  "depth": 809899,
  "transactions": [
    {
      "amount_out": 2975794,
      "fee": 0,
      "hash": "583493d5e5c564095d3c885075c5b96e3c541638fdb54300370447284b4a0901",
      "size": 300
    }
  ]
}
```

#### /block/header/#

```javascript
{
"hash": "dd40ba6a33e7c6ff84927d510881e285eba9a17cbde43da587aa6cc41883b852",
"prevHash": "51fa759a944875ff000ad68a3d5e77fea38ba9c3c01fa3ec7d3391cdf4441277",
"height": 50000,
"baseReward": 2975794,
"difficulty": 154653,
"majorVersion": 3,
"minorVersion": 0,
"nonce": 33060,
"size": 419,
"timestamp": 1514341632,
"alreadyGeneratedCoins": 148903595706,
"alreadyGeneratedTransactions": 60897,
"reward": 2975794,
"sizeMedian": 300,
"totalFeeAmount": 0,
"transactionsCumulativeSize": 300,
"transactionCount": 1,
"depth": 809923
}
```

#### /block/header/top

```javascript
{
  "hash": "43dbe714ebc601796e1befd019c92562ea3eaab1763c8222fd056007affd1242",
  "prevHash": "77b1fd25c2d7c28ebffbf088ae68a1e9ade6a43e09598762605256bd3706ca22",
  "height": 859515,
  "baseReward": 2904900,
  "difficulty": 353940243,
  "majorVersion": 4,
  "minorVersion": 0,
  "nonce": 45512,
  "size": 315,
  "timestamp": 1538775418,
  "alreadyGeneratedCoins": 2527732676245,
  "alreadyGeneratedTransactions": 2063651,
  "reward": 2904900,
  "sizeMedian": 230,
  "totalFeeAmount": 0,
  "transactionsCumulativeSize": 196,
  "transactionCount": 1,
  "depth": 0
}
```

#### /block/headers/#height#

```javascript
[
  {
    "size": 22041,
    "difficulty": 285124963,
    "hash": "62f0058453292af5e1aa070f8526f7642ab6974c6af2c17088c21b31679c813d",
    "height": 500000,
    "timestamp": 1527834137,
    "tx_count": 4
  },
  {
    "size": 384,
    "difficulty": 258237161,
    "hash": "74a45602da61b8b8ff565b1c81c854416046a23ca53f4416684ffaa60bc50796",
    "height": 499999,
    "timestamp": 1527834031,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 256087255,
    "hash": "ed628ff13eacd5b99c5d7bcb3aeb29ef8fc61dbb21d48b65e0cdaf5ab21211c1",
    "height": 499998,
    "timestamp": 1527834020,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 250900003,
    "hash": "6209668ecf02058a391cf6d4d065db411b2fe78a9ec7902b8fe9aee8d803f1d4",
    "height": 499997,
    "timestamp": 1527834001,
    "tx_count": 1
  },
  {
    "size": 3604,
    "difficulty": 270368184,
    "hash": "4ec8eb0b6408fd596a4174c18c40ecc868c3c33cdc7949e1aeac67a089c13279",
    "height": 499996,
    "timestamp": 1527833990,
    "tx_count": 2
  },
  {
    "size": 32739,
    "difficulty": 280586517,
    "hash": "8f4c57c1fe1f65f07a4be43934265211376a1d44c8d31ac1e6b60538772354c5",
    "height": 499995,
    "timestamp": 1527833949,
    "tx_count": 4
  },
  {
    "size": 418,
    "difficulty": 297551675,
    "hash": "13d3433e2303d55d9b15a49be491a085874ad49584549b8b943425d57be84e31",
    "height": 499994,
    "timestamp": 1527833901,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 289425100,
    "hash": "4d57d3887cecfc4d64841494925c9b48c5ba0a79cc71838b51b966e4adf2f81f",
    "height": 499993,
    "timestamp": 1527833854,
    "tx_count": 1
  },
  {
    "size": 3976,
    "difficulty": 301184295,
    "hash": "5949cc73d14d437c8bccb1646c8a1862a4cd99e7efbc2859c46b9d665f4c4cfb",
    "height": 499992,
    "timestamp": 1527833840,
    "tx_count": 2
  },
  {
    "size": 418,
    "difficulty": 273525460,
    "hash": "5f93f71e1f1594a207bce1a2d08d55adaefc8b04e7de21d89fe77dbb67d51518",
    "height": 499991,
    "timestamp": 1527833802,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 269653256,
    "hash": "a7d5e98fa780832192c1068e2af1b277b654884c83a7d5b4a995936be026c936",
    "height": 499990,
    "timestamp": 1527833786,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 279841060,
    "hash": "277332fddd6c1ced85aa8e63b1796ca6bff7d8cb0b9d34bb99d3c1dabb97bc21",
    "height": 499989,
    "timestamp": 1527833779,
    "tx_count": 1
  },
  {
    "size": 14016,
    "difficulty": 239161056,
    "hash": "b9aaa86ff549f3bd77fec7e675b2f1f7b9ee3049b74a8249a526d5ee27724e30",
    "height": 499988,
    "timestamp": 1527833750,
    "tx_count": 5
  },
  {
    "size": 998,
    "difficulty": 232042298,
    "hash": "08c88f0e0c55766e74389c12cabac47a71a9f19186211d42f158062a0670a200",
    "height": 499987,
    "timestamp": 1527833691,
    "tx_count": 2
  },
  {
    "size": 4224,
    "difficulty": 248137994,
    "hash": "96e2cfe53f7fce827a6d3978b5e1119723d6db1f404ad02aac13b0b6ea0dbf61",
    "height": 499986,
    "timestamp": 1527833649,
    "tx_count": 3
  },
  {
    "size": 418,
    "difficulty": 247667268,
    "hash": "6f71009b23dad7f460b89ccc13ba8b14d136606b25c1ae8876f28f277fbfb805",
    "height": 499985,
    "timestamp": 1527833610,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 253993375,
    "hash": "b401f72142f7db8eb8fb6709abd62fd9a00666ec1d15eee0155c164f026f3ac7",
    "height": 499984,
    "timestamp": 1527833607,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 279396269,
    "hash": "36d3e5e7a13e93bb1862056a8e60271f37574015b3ecb3e397175c31c463c18c",
    "height": 499983,
    "timestamp": 1527833584,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 271759605,
    "hash": "f9034dfce8a30ee7af00ac5440f03d3f7a3fb6e5687bdcf6839fa360e94e785f",
    "height": 499982,
    "timestamp": 1527833524,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 264459986,
    "hash": "2a0ac6dd8d99d29c8dc5938b376b38b778aa723c4e456f3e8c5cf26178b47457",
    "height": 499981,
    "timestamp": 1527833499,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 261456642,
    "hash": "8b789f9f7e796021a09e1f6f457550b0b247c0a724b003ee63f0adb47b509bf4",
    "height": 499980,
    "timestamp": 1527833476,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 208895309,
    "hash": "40ff7d1cdee3349ff55408c8ca881d1f12378e6ef5ce9a2bbab299ced6460157",
    "height": 499979,
    "timestamp": 1527833473,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 205450926,
    "hash": "8d594ef8e77ba424bf0aa53013ffdea935e23f198d0984e54f04703ed3902162",
    "height": 499978,
    "timestamp": 1527833450,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 186384104,
    "hash": "e704735b2ada761c6e011e244315ae03248e5b4d7dfc9d3520f9121be285100e",
    "height": 499977,
    "timestamp": 1527833438,
    "tx_count": 1
  },
  {
    "size": 1611,
    "difficulty": 163452803,
    "hash": "17983e2a3ef803dbf3fb9a7bb5df2492fedcb926b89885ee98b1f1e5da6c65ed",
    "height": 499976,
    "timestamp": 1527833423,
    "tx_count": 2
  },
  {
    "size": 4118,
    "difficulty": 181134431,
    "hash": "b5ce0d962a1dc619514519f629d067a76ee3ea2fa41917265cbed24587c2d5de",
    "height": 499975,
    "timestamp": 1527833415,
    "tx_count": 2
  },
  {
    "size": 418,
    "difficulty": 188993367,
    "hash": "e13c8aa0ffbef9e67264855f097d49bd907bb98fa1569d68029659607f76f2ac",
    "height": 499974,
    "timestamp": 1527833370,
    "tx_count": 1
  },
  {
    "size": 418,
    "difficulty": 186892280,
    "hash": "008988aaccb6bdb8099ab6dd91f35138fc3685ec1c855ad7692dbb15dff84451",
    "height": 499973,
    "timestamp": 1527833366,
    "tx_count": 1
  },
  {
    "size": 63969,
    "difficulty": 223243265,
    "hash": "33248e8b763cca84e4981c6beb2483cb87f970d7d710f36d5aecacb7c84910fa",
    "height": 499972,
    "timestamp": 1527833362,
    "tx_count": 9
  },
  {
    "size": 418,
    "difficulty": 240807483,
    "hash": "69c29fd3d5e106213e43dda6b463baff6a105193249414e0b9adb7e666bd71e2",
    "height": 499971,
    "timestamp": 1527833239,
    "tx_count": 1
  }
]
```

#### /transaction/pool

```javascript
[
  {
    "txnHash": "3e3d01ab1f32ad2e30448d28bdefe0baa799431ca49c258ad774d1e4e4d286f1",
    "fee": 100,
    "size": 5121,
    "amount": 2258064
  },
  {
    "txnHash": "60a776f4c29c0df673d2d86189b7106f07591fa485c0c01681f300a58501fbfe",
    "fee": 100,
    "size": 728,
    "amount": 799900
  },
  {
    "txnHash": "e8b01cc8d1d0b5b09283f225cba3f9d25845bf78807351f928db6d8091a9169f",
    "fee": 100,
    "size": 2496,
    "amount": 2093900
  },
  {
    "txnHash": "f26e4436a0d9acfe5a9f862d9c4b1dcb5e3d61b1d7361b8bad3570ab73e737c2",
    "fee": 100,
    "size": 6634,
    "amount": 3303626
  }
]
```

#### /transaction/#

```javascript
{
  "tx": {
    "amount_out": 2975794,
    "fee": 0,
    "hash": "583493d5e5c564095d3c885075c5b96e3c541638fdb54300370447284b4a0901",
    "mixin": 0,
    "paymentId": "",
    "size": 300,
    "extra": "",
    "unlock_time": 50040,
    "nonce": "000000000c91e4b8",
    "inputs": [
      {
        "keyImage": "",
        "amount": 2975794,
        "type": "ff"
      }
    ],
    "outputs": [
      {
        "outputIndex": 0,
        "globalIndex": 5976,
        "amount": 4,
        "key": "af7c6736cd74ed3d055e8d6942f33f18e7c66b8a3c92073c6e2a57a530e219df",
        "type": "02"
      },
      {
        "outputIndex": 1,
        "globalIndex": 6063,
        "amount": 90,
        "key": "11937d440eb57d38346cb0eea26187b94f9b5da19b955ed639e3a4d0093bbb05",
        "type": "02"
      },
      {
        "outputIndex": 2,
        "globalIndex": 7435,
        "amount": 700,
        "key": "4d50e0f402e74b122e5d451e08904082d459cabb3d0edcf1d70ed53470b0cf62",
        "type": "02"
      },
      {
        "outputIndex": 3,
        "globalIndex": 4929,
        "amount": 5000,
        "key": "1bebacef3ba5086b7c4ae6fa2281b321ab752cb04b8fa371b2a2d06215ae057f",
        "type": "02"
      },
      {
        "outputIndex": 4,
        "globalIndex": 50143,
        "amount": 70000,
        "key": "c1c6daff34e32b4231e6bbd1d1e3ee450826bbd3cd4903c05e5018c3ea4cf37a",
        "type": "02"
      },
      {
        "outputIndex": 5,
        "globalIndex": 52111,
        "amount": 900000,
        "key": "d2dc2aa7eacfa9c28d03d1821da799a3b47425d84d9017f641e0ca3e93fe870f",
        "type": "02"
      },
      {
        "outputIndex": 6,
        "globalIndex": 53556,
        "amount": 2000000,
        "key": "4fe95ecd62cbbda85d34539c4ed759f9d31d0097d114ccd6083b1326005780e0",
        "type": "02"
      }
    ]
  },
  "block": {
    "cumul_size": 419,
    "difficulty": 154653,
    "hash": "dd40ba6a33e7c6ff84927d510881e285eba9a17cbde43da587aa6cc41883b852",
    "height": 50000,
    "timestamp": 1514341632,
    "tx_count": 1
  }
}
```

#### /transaction/#/inputs

```javascript
[
  {
    "keyImage": "0245107cc01c60e9e91fbb894b2da4261ccb0993338e5ab8f52499469affc9d0",
    "amount": 600,
    "type": "02"
  },
  {
    "keyImage": "7d9db3722a5d0915cfd5d6ae5cdbdcaa9692c69d9a7a78dea33c166662318f70",
    "amount": 600,
    "type": "02"
  },
  {
    "keyImage": "2310a4b34d59e997a62f2c53578646f8968790f97964ebbcfdebddcb2ad24fd9",
    "amount": 2000000,
    "type": "02"
  }
]
```

#### /transaction/#/outputs

```javascript
[
  {
    "outputIndex": 0,
    "globalIndex": 717763,
    "amount": 1,
    "key": "8a94b668821b9881357ef04119fe73edbe31999af88513be0aeee15544d4d4da",
    "type": "02"
  },
  {
    "outputIndex": 1,
    "globalIndex": 717764,
    "amount": 1,
    "key": "35532012ea5a5858f7bd8ecfc9791648abecd008d712a31da79c8e4209e22fca",
    "type": "02"
  },
  {
    "outputIndex": 2,
    "globalIndex": 101901,
    "amount": 2,
    "key": "a66af661dcfe0d0be31521fb1fec884212df61f685333ebbf447818f46f9d69f",
    "type": "02"
  },
  {
    "outputIndex": 3,
    "globalIndex": 101902,
    "amount": 2,
    "key": "4f7806b78c6dfd84baf3358790a3e3286d9d234fc0ccf6ef9b7efde5eecad2b5",
    "type": "02"
  },
  {
    "outputIndex": 4,
    "globalIndex": 101903,
    "amount": 2,
    "key": "e503b8615979ff3b2608155ae82e356e88934888615e1a39cac5b26c5b73574c",
    "type": "02"
  },
  {
    "outputIndex": 5,
    "globalIndex": 101904,
    "amount": 2,
    "key": "6644031c98578d385e26ce42c2bf68d39108d3ac11a56d2c0661d14fd95f0204",
    "type": "02"
  },
  {
    "outputIndex": 6,
    "globalIndex": 99414,
    "amount": 3,
    "key": "d2b9a552257cbff80895cf1908a4a6505555c16c9c932c0625d2c1f2eb59218e",
    "type": "02"
  },
  {
    "outputIndex": 7,
    "globalIndex": 99863,
    "amount": 4,
    "key": "b9268d8ed45c84b701205df58cf5d8079b97ed189380f2875df8c988878b278c",
    "type": "02"
  },
  {
    "outputIndex": 8,
    "globalIndex": 99864,
    "amount": 4,
    "key": "97809f2f4dd2d8af0eac0d583bab7c3590ccc1f3ed7e299800602e45fe54d3a6",
    "type": "02"
  },
  {
    "outputIndex": 9,
    "globalIndex": 99865,
    "amount": 4,
    "key": "eb10be90017c55d8189e389e85c359468559f5506868807c7fdb6d280849aead",
    "type": "02"
  },
  {
    "outputIndex": 10,
    "globalIndex": 103239,
    "amount": 5,
    "key": "db18fbd65037858f9f6c9756df0c62de0cded66fc2258dfa9d688a72853fde22",
    "type": "02"
  },
  {
    "outputIndex": 11,
    "globalIndex": 103240,
    "amount": 5,
    "key": "c011dcdd0aed6f083662111f82333c6a6a1fad7040fa11629cde1d37c997c049",
    "type": "02"
  },
  {
    "outputIndex": 12,
    "globalIndex": 98153,
    "amount": 6,
    "key": "483e482bf7e5ceb617999e2eb1da14c3cf46045e003b4623bfabb7eb60dae1a3",
    "type": "02"
  },
  {
    "outputIndex": 13,
    "globalIndex": 97167,
    "amount": 7,
    "key": "aea30714cb268116b6bd7323734fd2ecc8d26038679bf374b1d6875cdd65392b",
    "type": "02"
  },
  {
    "outputIndex": 14,
    "globalIndex": 97168,
    "amount": 7,
    "key": "b9bc5d57d61be859b2bc45b0d6d8c1e09ee0702f95564283a14bbe9fb42a185c",
    "type": "02"
  },
  {
    "outputIndex": 15,
    "globalIndex": 97169,
    "amount": 7,
    "key": "065078b8d40307deab75b48f272cc98b4b540f000fdf3dfa02e97bca32dac0ed",
    "type": "02"
  },
  {
    "outputIndex": 16,
    "globalIndex": 98340,
    "amount": 9,
    "key": "9e25628717af6b8882d362f06de1cf41774f6a31602a261c444f4abbc0367b36",
    "type": "02"
  },
  {
    "outputIndex": 17,
    "globalIndex": 98341,
    "amount": 9,
    "key": "4141ae5de6f215013a162f6e3801bacbeb8400203aeff41f8f157221af8f441e",
    "type": "02"
  },
  {
    "outputIndex": 18,
    "globalIndex": 113243,
    "amount": 10,
    "key": "4e9929940231179547f09fcf3b51b6ec05eef519e79a8e58ffff17149054adbc",
    "type": "02"
  },
  {
    "outputIndex": 19,
    "globalIndex": 113244,
    "amount": 10,
    "key": "966c6c33348e70c860785955d84790b9185eb48bed1ff62d71a11b14ec754c94",
    "type": "02"
  },
  {
    "outputIndex": 20,
    "globalIndex": 113245,
    "amount": 10,
    "key": "5b877b8eadc1562d22b40aa9e4c41d541e72826812cfc71fee8d2d894cf5d277",
    "type": "02"
  },
  {
    "outputIndex": 21,
    "globalIndex": 113246,
    "amount": 10,
    "key": "494c2f0129c15b882f233e4f037fbb7ec977bc7ae87f79ba785b42278c341931",
    "type": "02"
  },
  {
    "outputIndex": 22,
    "globalIndex": 113247,
    "amount": 10,
    "key": "71dfa56e01982db6deee7ffd8311f43a18a22e6c269f918878e8bb74516a1a4c",
    "type": "02"
  },
  {
    "outputIndex": 23,
    "globalIndex": 110643,
    "amount": 20,
    "key": "aa20c495162689ac5215d0a06cbf3daa2e9ff3d3f2212897da4b31f6f9a0db0a",
    "type": "02"
  },
  {
    "outputIndex": 24,
    "globalIndex": 110644,
    "amount": 20,
    "key": "bea6419e07a0e75ceba28923b030d41846f5b1fc0ff126395c8bdb54eaa24cf2",
    "type": "02"
  },
  {
    "outputIndex": 25,
    "globalIndex": 110294,
    "amount": 30,
    "key": "225ff09793a739a627f0f8bed9e146b244a316537b2975f9a49f7dee79d13eb9",
    "type": "02"
  },
  {
    "outputIndex": 26,
    "globalIndex": 112360,
    "amount": 40,
    "key": "4395afa766193b2c141f469437022bffc1e59f15a8d20c5103db964767d7d02c",
    "type": "02"
  },
  {
    "outputIndex": 27,
    "globalIndex": 112361,
    "amount": 40,
    "key": "5e03573b0f2ba218ac1ddadc16d8bde49ef50e36684d2d3f10ba31857ca05eed",
    "type": "02"
  },
  {
    "outputIndex": 28,
    "globalIndex": 116542,
    "amount": 50,
    "key": "8bd34cb5fbd1005d87912f349bcfdd95e9d7f26fe199104c1d430414f6d599b0",
    "type": "02"
  },
  {
    "outputIndex": 29,
    "globalIndex": 116543,
    "amount": 50,
    "key": "bff3024de87aa6ec7165ce4ba8e4b6f10b0886aa93c805437740c1f90990a79d",
    "type": "02"
  },
  {
    "outputIndex": 30,
    "globalIndex": 115181,
    "amount": 60,
    "key": "9f4b752d1b38ff75b865c4d536eb34abad8175cf74d4a15424f3a4cce2818d9e",
    "type": "02"
  },
  {
    "outputIndex": 31,
    "globalIndex": 115182,
    "amount": 60,
    "key": "4f14ca7a7b9e8f06aae83a41b47bde13dad9964066bf9105ee3f3564e0bc441b",
    "type": "02"
  },
  {
    "outputIndex": 32,
    "globalIndex": 115183,
    "amount": 60,
    "key": "0dc16ae906e848b0ddaeeb036162f320eeeb0cbd6fbac5e3e531fdc8cfeed2d4",
    "type": "02"
  },
  {
    "outputIndex": 33,
    "globalIndex": 129861,
    "amount": 80,
    "key": "26bc08c432dc2778a14d203f95c39f05c1043fe1fbe48b64122d873e1bff5986",
    "type": "02"
  },
  {
    "outputIndex": 34,
    "globalIndex": 129862,
    "amount": 80,
    "key": "48cf87c25cdcc72d6f758b28671defda962e97bcb7c0f3ddf2df0d2b07b2d79b",
    "type": "02"
  },
  {
    "outputIndex": 35,
    "globalIndex": 552916,
    "amount": 100,
    "key": "8a1f72f3f8d6f04f7d8c1700dae4746bb75eee6c28f21b249afbc08be103a133",
    "type": "02"
  },
  {
    "outputIndex": 36,
    "globalIndex": 552917,
    "amount": 100,
    "key": "dc968530d29058fd5c0519c9fc2ec9d94e2796aae441b24bb97de68763623806",
    "type": "02"
  },
  {
    "outputIndex": 37,
    "globalIndex": 552918,
    "amount": 100,
    "key": "651568c1eac75df9033f721846e9848ca5eb24a4020826c601ff1a56adc1e0c1",
    "type": "02"
  },
  {
    "outputIndex": 38,
    "globalIndex": 552919,
    "amount": 100,
    "key": "a25683292a7cbf9f38210347917877559386f4ae2df50a5e6994d703d4e560f0",
    "type": "02"
  },
  {
    "outputIndex": 39,
    "globalIndex": 507610,
    "amount": 200,
    "key": "498d3f36ee8606feacc1ed7e8230d37c548600e30c1b30a296e90da10b6eef48",
    "type": "02"
  },
  {
    "outputIndex": 40,
    "globalIndex": 507611,
    "amount": 200,
    "key": "cac4f819ce80e5eee425ab45049d1ea872dcb2dcfa853b2a1f549a07599530b8",
    "type": "02"
  },
  {
    "outputIndex": 41,
    "globalIndex": 500442,
    "amount": 500,
    "key": "11560641f623ddb6d99cede5db79ca5c5c2ad531ace51a9affda5b2121314fcd",
    "type": "02"
  },
  {
    "outputIndex": 42,
    "globalIndex": 500443,
    "amount": 500,
    "key": "4a31241129c5b2e789329cac05b60cdcbe661232061cccf17b950e7246900462",
    "type": "02"
  },
  {
    "outputIndex": 43,
    "globalIndex": 500444,
    "amount": 500,
    "key": "d7e482bd068d6288766ed28770e263dbc368f778202e8870f8206e2d843ac6c5",
    "type": "02"
  },
  {
    "outputIndex": 44,
    "globalIndex": 500445,
    "amount": 500,
    "key": "69a59a17e21387a5e9cebfd95d75ff2e4efb651819ff4a9c053b6b4fc395b98e",
    "type": "02"
  },
  {
    "outputIndex": 45,
    "globalIndex": 491915,
    "amount": 600,
    "key": "d84c4c05a6876e0a1cd1fcbe7bc87ae864fca07a0b60f558353839bed3fb9762",
    "type": "02"
  },
  {
    "outputIndex": 46,
    "globalIndex": 490593,
    "amount": 700,
    "key": "74fc3207773eeb7301699fb7fb105286c7f5cac031b11c5e4cad02f588ec879f",
    "type": "02"
  },
  {
    "outputIndex": 47,
    "globalIndex": 490594,
    "amount": 700,
    "key": "84eb4d16f980fc12d1cecd6aa039fa5f71e086adec6ea196bce1223e7525290a",
    "type": "02"
  },
  {
    "outputIndex": 48,
    "globalIndex": 495873,
    "amount": 800,
    "key": "71fc17f9c3403d091c4d9bffd78d0d1a5adda8e8df80ac90d4f5d917fe53223e",
    "type": "02"
  },
  {
    "outputIndex": 49,
    "globalIndex": 522804,
    "amount": 900,
    "key": "2db6ecb0fa2ab2f9b0fc5d789e3d94b6a60b395439a9d8356cd567cb5cc3b3fc",
    "type": "02"
  },
  {
    "outputIndex": 50,
    "globalIndex": 522805,
    "amount": 900,
    "key": "70768f2a5b9368159769cfc501ccea65d18c1b2bbdf2265e8f2712bf8601a01b",
    "type": "02"
  },
  {
    "outputIndex": 51,
    "globalIndex": 522806,
    "amount": 900,
    "key": "8dba20ac09e9f160b76ecf76198c3684a8e419083dca2e0cbc5a57cc7327f93a",
    "type": "02"
  },
  {
    "outputIndex": 52,
    "globalIndex": 636827,
    "amount": 1000,
    "key": "5ebd24d4e21f38b5eb87b138b0fcdcb0a216f1c1dd0d08d0fd4c70d4b49a8970",
    "type": "02"
  },
  {
    "outputIndex": 53,
    "globalIndex": 636828,
    "amount": 1000,
    "key": "dcaea8ee9e6fb1fa0d7f5da456e7939081eba954a242c9f94d6dc8a2cedd4c7c",
    "type": "02"
  },
  {
    "outputIndex": 54,
    "globalIndex": 636829,
    "amount": 1000,
    "key": "56ae9252bf0727ea630fc219fb35694b7dbf3818fe4e7791a033d3efcc8e3d9c",
    "type": "02"
  },
  {
    "outputIndex": 55,
    "globalIndex": 636830,
    "amount": 1000,
    "key": "cab997c0a792448652a7f79dfb506fa8227dbf3243c6ca5e7d1a9da2b4b9e6bc",
    "type": "02"
  },
  {
    "outputIndex": 56,
    "globalIndex": 538542,
    "amount": 2000,
    "key": "057ba0de61556d1deb3b43eae32f17a553c55baf270fe2ce5cc6b4b62c6a7a67",
    "type": "02"
  },
  {
    "outputIndex": 57,
    "globalIndex": 538543,
    "amount": 2000,
    "key": "5742825b84402f0bf11d8415f9db5622850a46f5a8574d59d5b26ae97ddf0358",
    "type": "02"
  },
  {
    "outputIndex": 58,
    "globalIndex": 538544,
    "amount": 2000,
    "key": "9c8093a21e120bb7d2fdc75a3b4207f1ad36f6f6689449f87e45dccb14e87cd2",
    "type": "02"
  },
  {
    "outputIndex": 59,
    "globalIndex": 538545,
    "amount": 2000,
    "key": "2e449ea2683d5f9534a2c0bf5c3fd8ff45e9d5265d2fcf5adfe4a6f494693e69",
    "type": "02"
  },
  {
    "outputIndex": 60,
    "globalIndex": 538546,
    "amount": 2000,
    "key": "55475e1b8e6d7ca67ebfa65ce8e9017b0aba39d54231278bf6aeb9fa001878b7",
    "type": "02"
  },
  {
    "outputIndex": 61,
    "globalIndex": 538547,
    "amount": 2000,
    "key": "2844e18d1283cbcf0219b75ef82b75c4ab5357914efe122503d9ca93c28c1102",
    "type": "02"
  },
  {
    "outputIndex": 62,
    "globalIndex": 515559,
    "amount": 3000,
    "key": "846fdabbe8d099fa36f4b1d6a7e847e981ceb73aae17642e98fd432fd755fca2",
    "type": "02"
  },
  {
    "outputIndex": 63,
    "globalIndex": 515560,
    "amount": 3000,
    "key": "68d6e5afb7aff3d698e19b0c0166432f09ffd9079f335d0d9ec7cca799c9cac9",
    "type": "02"
  },
  {
    "outputIndex": 64,
    "globalIndex": 495985,
    "amount": 4000,
    "key": "eb67e4e570a34c75fe47518d908a518581e36e478d2fcdd5121bc1991051cc48",
    "type": "02"
  },
  {
    "outputIndex": 65,
    "globalIndex": 477535,
    "amount": 5000,
    "key": "fe7c10087b9a11c961e0c31bce09a72b6861830e898ecc615fa3b4bcaa6bf0dc",
    "type": "02"
  },
  {
    "outputIndex": 66,
    "globalIndex": 462321,
    "amount": 6000,
    "key": "f72fdb85bd32f5244008971bad48ee0e65ae4e4a927171de6f34a88f83fbaec7",
    "type": "02"
  },
  {
    "outputIndex": 67,
    "globalIndex": 446744,
    "amount": 7000,
    "key": "4e2429bf2dddd4febc921c79bbf4301bec6d4395e7607cb05b34b78355f0c997",
    "type": "02"
  },
  {
    "outputIndex": 68,
    "globalIndex": 431520,
    "amount": 8000,
    "key": "35f25e54ad2cab67cd9e67ce365ef14bba38cff536ed06839dfa75fd234c05d9",
    "type": "02"
  },
  {
    "outputIndex": 69,
    "globalIndex": 580473,
    "amount": 10000,
    "key": "07e30b9cb78207e5ca413a9769833267e1714d84f309d99fb40ea0db409a12e3",
    "type": "02"
  },
  {
    "outputIndex": 70,
    "globalIndex": 580474,
    "amount": 10000,
    "key": "2668776e00d4ced732653f40bfee593a5a419bcc82537dbc4c6abeecd327bdc9",
    "type": "02"
  },
  {
    "outputIndex": 71,
    "globalIndex": 580475,
    "amount": 10000,
    "key": "ae6372f456f2f56df4b01cb4eb391fc656adabb5d77aa961bc2d2c5c0e696d1d",
    "type": "02"
  },
  {
    "outputIndex": 72,
    "globalIndex": 580476,
    "amount": 10000,
    "key": "793132378620544070a54d5574eb2eb0eb206ae95f4d257658f82138ca8686a9",
    "type": "02"
  },
  {
    "outputIndex": 73,
    "globalIndex": 580477,
    "amount": 10000,
    "key": "df5d7bb1f7a7157f8c2e2c4bea587c0149f01002d89aeef8e22c223d17794fc6",
    "type": "02"
  },
  {
    "outputIndex": 74,
    "globalIndex": 580478,
    "amount": 10000,
    "key": "01abd25a2e6b1c02e98a26130365de524d46ca4d78d7f0e72b4e0886325f48f8",
    "type": "02"
  },
  {
    "outputIndex": 75,
    "globalIndex": 580479,
    "amount": 10000,
    "key": "aa3c9e9ea2e0865efcf571aae49029ad5aceaef75b37c121531f09305a49e239",
    "type": "02"
  },
  {
    "outputIndex": 76,
    "globalIndex": 580480,
    "amount": 10000,
    "key": "358c0a630e68ecf4bb40d18f334703d1e540b28183ea08d62f6b574dd661cb50",
    "type": "02"
  },
  {
    "outputIndex": 77,
    "globalIndex": 580481,
    "amount": 10000,
    "key": "f47df3e61442bddbacc3f91b3a73a25fe2abd769824a826554c6b63a45db9dbc",
    "type": "02"
  },
  {
    "outputIndex": 78,
    "globalIndex": 580482,
    "amount": 10000,
    "key": "7fef86dcfd61f93dd82ca05e68bfeb9d249aab4379969cf43df332242ac1afa2",
    "type": "02"
  },
  {
    "outputIndex": 79,
    "globalIndex": 580483,
    "amount": 10000,
    "key": "a67ac01e814bcbee58052c4f17cd5dfe70685d2cc7df8e8cd8d2a89baa4c4d1b",
    "type": "02"
  },
  {
    "outputIndex": 80,
    "globalIndex": 580484,
    "amount": 10000,
    "key": "cb95b59b800eacc100a3ddb48ec4f2c00ebd5f0a7153004fe0f53a2eb4605063",
    "type": "02"
  },
  {
    "outputIndex": 81,
    "globalIndex": 580485,
    "amount": 10000,
    "key": "0e311c28bea3077c511a6a37e3394c5067c8abb8688e0d645e202d091e7f766e",
    "type": "02"
  },
  {
    "outputIndex": 82,
    "globalIndex": 580486,
    "amount": 10000,
    "key": "692d32dc5ac20a16b8bcbd9498fa1ca69b054e1e7c746a4f8ebc5b9bb7d9aced",
    "type": "02"
  },
  {
    "outputIndex": 83,
    "globalIndex": 355541,
    "amount": 20000,
    "key": "af074fd20e9f29223ae0e17097e6e2eb6c3e3098485e2aec3f0d15d147bfb8dd",
    "type": "02"
  },
  {
    "outputIndex": 84,
    "globalIndex": 355542,
    "amount": 20000,
    "key": "9948de654c3be4e5045b75c777a9464c31102d3e6baf4f661a1740dc1790124b",
    "type": "02"
  },
  {
    "outputIndex": 85,
    "globalIndex": 968599,
    "amount": 50000,
    "key": "bb4f0a83391e0f3cc2749636a49b6a6aab9e15873d24f777ed182207b7654b09",
    "type": "02"
  },
  {
    "outputIndex": 86,
    "globalIndex": 968600,
    "amount": 50000,
    "key": "4b567750d233a9263b42bfb632db49d692d512eac3b1f7208aa0735f14ba977e",
    "type": "02"
  },
  {
    "outputIndex": 87,
    "globalIndex": 596788,
    "amount": 60000,
    "key": "7bac696c8f07613229a57b4037358bdface1a42ea9aa5614f6174e6064cff9ee",
    "type": "02"
  },
  {
    "outputIndex": 88,
    "globalIndex": 77005,
    "amount": 600000,
    "key": "4bb44f1ce95542194abac5a93b4374e2a1469d3442263da40b2f134b85c00bf8",
    "type": "02"
  },
  {
    "outputIndex": 89,
    "globalIndex": 184535,
    "amount": 1000000,
    "key": "51905a24b0333cc356660e5eb4d2090fc147966c161b59acad0fcef7b1e50e3d",
    "type": "02"
  }
]
```

#### /transactions/#

```javascript
[
  "0001237359789845f54c08e260c192cccf0af19f7c7cc87185c2d14861441aee",
  "00505a583210568948c7c045a2d26d828e52e702f2141668e75d560f70d9f2a3",
  "00b64f989af5ece9bd34bfa23ce81990a309a21ef2eb60b188b6d834a07b42b9",
  "011acd09d5bd8d2d55fb5fc215d27913e19a5cf5eebd44137af4867652c26622",
  "0175bae95a693e7f514fdeb1f066af6f4b2fc9f330f0c914ead9a01911507431",
  "017be21ae706f13a5a858243d18a0227c08ba29f49f1cc5af346bbeefb3992d4",
  "019e92fc861b891d18bcd0b0567ab90f6d524324d72f639637935f88d9871a16",
  "01ed4679347a217e7b9a44836974342e348c9bb6e05c1124d40cf091448cdb0e",
  "0216a17e2ef0ae7b18c5497ffdb34b462105523f2b5bbe9c7a2a9ba5aca34717",
  "02284575a0ae7db431aea1b70cae75b7347eebb485b4ec31ce665e58c03985f3",
  "023bf397b611a44bd668447726609418143e24fd2b13003259a25c075cbe0d16",
  "027b55344489ce771c466ad60910ccbf8e975c8a66732c30ebfab6efe311c109",
  "02898b8372746d79bef5da41596d54014a9b30359f19605194f2ff2eee88e451",
  "02a8f70fe4dc7fb00b485a714a526c5c463758edb741914c83c2f003bae0e8f1",
  "02b91d4dc3593c8ee49de745ab27b5becdd0e57a8e7187e95134d1dddaddc669"
]
```

#### /sync

##### POST Payload

The base payload has the following structure:

```javascript
{
  "lastKnownBlockHashes": [...],
  "blockCount": 100
}
```

`lastKnownBlockHashes` must contain an array of block hashes that you already know about in descending order. If you mimic the way that most CryptoNote coins handle this, the order of the block hashes you supply looks like this. We will return results from the highest block that is supplied to us.

0) Latest known hash (n)
1) (n - 1)
2) (n - 2)
3) (n - 3)
4) (n - 4)
5) (n - 5)
6) (n - 6)
7) (n - 7)
8) (n - 8)
9) (n - 9)
10) (n - 10)
11) ((n - 10) - 2^1)
12) ((n - 10) - 2^2)
13) ((n - 10) - 2^3)
14) ((n - 10) - 2^4)
15) etc...
16) Genesis block hash

##### Response

This response has been condensed considerably for the documentation.

```javascript
[
  {
    "blockHash": "7d6db7b77232d41c19d898e81c85ecf08c4e8dfa3434f975a319f6261a695739",
    "height": 502345,
    "timestamp": 1527907348,
    "txnHash": "d0a94f1e46325a2608e5dec09bb12c0481763958d46b1625dda94d33437573c5",
    "publicKey": "60fcc79b81cefc3168797af8c3a7f2139dfa335feb2cfec9208ba87560dfb34d",
    "unlockTime": 502385,
    "outputIndex": 4,
    "globalIndex": 323547,
    "outputKey": "720d8f81aacc83b141db7c5df0c11533e58110f8258ccfa5e2f18400a1fc087c",
    "amount": 30000,
    "paymentId": "",
    "type": "02"
  },
  {
    "blockHash": "7d6db7b77232d41c19d898e81c85ecf08c4e8dfa3434f975a319f6261a695739",
    "height": 502345,
    "timestamp": 1527907348,
    "txnHash": "d0a94f1e46325a2608e5dec09bb12c0481763958d46b1625dda94d33437573c5",
    "publicKey": "60fcc79b81cefc3168797af8c3a7f2139dfa335feb2cfec9208ba87560dfb34d",
    "unlockTime": 502385,
    "outputIndex": 0,
    "globalIndex": 105590,
    "outputKey": "43e0a055155dea315781ff25f723a68421ac9d7204e7ccc69d2b199bdb480f1b",
    "amount": 5,
    "paymentId": "",
    "type": "02"
  },
  {
    "blockHash": "7d6db7b77232d41c19d898e81c85ecf08c4e8dfa3434f975a319f6261a695739",
    "height": 502345,
    "timestamp": 1527907348,
    "txnHash": "d0a94f1e46325a2608e5dec09bb12c0481763958d46b1625dda94d33437573c5",
    "publicKey": "60fcc79b81cefc3168797af8c3a7f2139dfa335feb2cfec9208ba87560dfb34d",
    "unlockTime": 502385,
    "outputIndex": 5,
    "globalIndex": 563185,
    "outputKey": "b4f6463b8747002a1f1615f15fd1acf8937248b808b3b976b4c33c310124cfd7",
    "amount": 900000,
    "paymentId": "",
    "type": "02"
  },
  {
    "blockHash": "7d6db7b77232d41c19d898e81c85ecf08c4e8dfa3434f975a319f6261a695739",
    "height": 502345,
    "timestamp": 1527907348,
    "txnHash": "d0a94f1e46325a2608e5dec09bb12c0481763958d46b1625dda94d33437573c5",
    "publicKey": "60fcc79b81cefc3168797af8c3a7f2139dfa335feb2cfec9208ba87560dfb34d",
    "unlockTime": 502385,
    "outputIndex": 6,
    "globalIndex": 562471,
    "outputKey": "86c524030d67b066174787f28cac119f8b1137023efa866be1850c75cc4817dc",
    "amount": 2000000,
    "paymentId": "",
    "type": "02"
  },
  {
    "blockHash": "7d6db7b77232d41c19d898e81c85ecf08c4e8dfa3434f975a319f6261a695739",
    "height": 502345,
    "timestamp": 1527907348,
    "txnHash": "d0a94f1e46325a2608e5dec09bb12c0481763958d46b1625dda94d33437573c5",
    "publicKey": "60fcc79b81cefc3168797af8c3a7f2139dfa335feb2cfec9208ba87560dfb34d",
    "unlockTime": 502385,
    "outputIndex": 2,
    "globalIndex": 531761,
    "outputKey": "3d9fcde1787795f1d3f2e1f166f5ded51dcb20e155d370801a12cc06fee547c6",
    "amount": 900,
    "paymentId": "",
    "type": "02"
  },
  {
    "blockHash": "7d6db7b77232d41c19d898e81c85ecf08c4e8dfa3434f975a319f6261a695739",
    "height": 502345,
    "timestamp": 1527907348,
    "txnHash": "d0a94f1e46325a2608e5dec09bb12c0481763958d46b1625dda94d33437573c5",
    "publicKey": "60fcc79b81cefc3168797af8c3a7f2139dfa335feb2cfec9208ba87560dfb34d",
    "unlockTime": 502385,
    "outputIndex": 3,
    "globalIndex": 482943,
    "outputKey": "99ec6e7822457bdb7ce2a832a03c003f3ced841ee8cad0ea19bd96a9acf92d83",
    "amount": 5000,
    "paymentId": "",
    "type": "02"
  },
  {
    "blockHash": "7d6db7b77232d41c19d898e81c85ecf08c4e8dfa3434f975a319f6261a695739",
    "height": 502345,
    "timestamp": 1527907348,
    "txnHash": "d0a94f1e46325a2608e5dec09bb12c0481763958d46b1625dda94d33437573c5",
    "publicKey": "60fcc79b81cefc3168797af8c3a7f2139dfa335feb2cfec9208ba87560dfb34d",
    "unlockTime": 502385,
    "outputIndex": 1,
    "globalIndex": 119561,
    "outputKey": "6559bc49da1d4ac2090be8bd7ee7cd627d17e886cdc058afb4e7c2b2fcb81e07",
    "amount": 50,
    "paymentId": "",
    "type": "02"
  }
]
```

###### (c) 2018 TurtlePay™ Development Team
