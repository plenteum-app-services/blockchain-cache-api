// Copyright (c) 2018, TurtlePay Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Config = require('./config.json')
const DatabaseBackend = require('./lib/databaseBackend.js')
const util = require('util')
const Compression = require('compression')
const Helmet = require('helmet')
const BodyParser = require('body-parser')
const Express = require('express')
const isHex = require('is-hex')

/* Let's set up a standard logger. Sure it looks cheap but it's
   reliable and won't crash */
function log (message) {
  console.log(util.format('%s: %s', (new Date()).toUTCString(), message))
}

function logHTTPRequest (req, params) {
  params = params || ''
  log(util.format('[REQUEST] (%s) %s %s', req.ip, req.path, params))
}

function logHTTPError (req, message) {
  message = message || 'Parsing error'
  log(util.format('[ERROR] (%s) %s: %s', req.ip, req.path, message))
}

/* This is a special magic function to make sure that when
   we parse a number that the whole thing is actually a
   number */
function toNumber (term) {
  if (typeof term === 'number') {
    return term
  }
  if (parseInt(term).toString() === term) {
    return parseInt(term)
  } else {
    return false
  }
}

/* Set up our database connection */
const database = new DatabaseBackend({
  host: Config.mysql.host,
  port: Config.mysql.port,
  username: Config.mysql.username,
  password: Config.mysql.password,
  database: Config.mysql.database,
  connectionLimit: Config.mysql.connectionLimit
})

log('Connected to database backend at ' + database.host + ':' + database.port)

const app = Express()

/* Automatically decode JSON input from client requests */
app.use(BodyParser.json())

/* Catch body-parser errors */
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).send()
  }
  next()
})

/* Set up a few of our headers to make this API more functional */
app.use((req, res, next) => {
  res.header('X-Requested-With', '*')
  res.header('Access-Control-Allow-Origin', Config.corsHeader)
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.header('Cache-Control', 'max-age=30, public')
  next()
})

/* Set up our system to use Helmet */
app.use(Helmet())

/* Last but certainly not least, enable compression because we're going to need it */
app.use(Compression())

/* Return the underlying information about the daemon(s) we are polling */
app.get('/info', (req, res) => {
  database.getInfo().then((info) => {
    logHTTPRequest(req)
    return res.json(info)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get information regarding the current cache height */
app.get('/height', (req, res) => {
  var networkData
  database.getInfo().then((info) => {
    networkData = info
    return database.getLastBlockHeader()
  }).then((header) => {
    logHTTPRequest(req)
    return res.json({
      height: header.height,
      networkHeight: networkData.network_height
    })
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get the current circulating currency amount */
app.get('/supply', (req, res) => {
  database.getLastBlockHeader().then((header) => {
    logHTTPRequest(req)
    const supply = (header.alreadyGeneratedCoins / Math.pow(10, Config.coinDecimals)).toFixed(Config.coinDecimals).toString()
    return res.send(supply)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get block information for the last 1,000 blocks before
   the specified block inclusive of the specified blocks */
app.get('/block/headers/:search/bulk', (req, res) => {
  const idx = toNumber(req.params.search) || -1

  /* If the caller did not specify a valid height then
     they most certainly didn't read the directions */
  if (idx === -1) {
    logHTTPError(req)
    return res.status(400).send()
  }

  database.getBlocks(idx, 1000).then((blocks) => {
    logHTTPRequest(req)
    return res.json(blocks)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get block information for the last 30 blocks before
   the specified block inclusive of the specified block */
app.get('/block/headers/:search', (req, res) => {
  const idx = toNumber(req.params.search) || -1

  /* If the caller did not specify a valid height then
     they most certainly didn't read the directions */
  if (idx === -1) {
    logHTTPError(req)
    return res.status(400).send()
  }

  database.getBlocks(idx).then((blocks) => {
    logHTTPRequest(req)
    return res.json(blocks)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get the last block header */
app.get('/block/header/top', (req, res) => {
  database.getLastBlockHeader().then((header) => {
    logHTTPRequest(req)
    return res.json(header)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get the block header for the specified block (by hash or height) */
app.get('/block/header/:search', (req, res) => {
  const idx = req.params.search

  /* If we suspect that we were passed a hash, let's go look for it */
  if (idx.length === 64) {
    /* But first, did they pass us only hexadecimal characters ? */
    if (!isHex(idx)) {
      logHTTPError(req)
      return res.status(400).send()
    }

    database.getBlockHeaderByHash(idx).then((header) => {
      logHTTPRequest(req)
      return res.json(header)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  } else {
    /* If they didn't pass us a number, we need to get out of here */
    if (!toNumber(idx)) {
      logHTTPError(req)
      return res.status(400).send()
    }

    database.getBlockHeaderByHeight(idx).then((header) => {
      logHTTPRequest(req)
      return res.json(header)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  }
})

/* Get the count of blocks in the backend database */
app.get('/block/count', (req, res) => {
  database.getBlockCount().then((count) => {
    return res.json({
      blockCount: count
    })
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get block information for the specified block (by hash or height) */
app.get('/block/:search', (req, res) => {
  const idx = req.params.search

  /* If we suspect that we were passed a hash, let's go look for it */
  if (idx.length === 64) {
    /* But first, did they pass us only hexadecimal characters ? */
    if (!isHex(idx)) {
      logHTTPError(req)
      return res.status(400).send()
    }

    database.getBlock(idx).then((block) => {
      logHTTPRequest(req)
      return res.json(block)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  } else {
    /* If they didn't pass us a number, we need to get out of here */
    if (!toNumber(idx)) {
      logHTTPError(req)
      return res.status(400).send()
    }

    database.getBlockHeaderByHeight(idx).then((header) => {
      return database.getBlock(header.hash)
    }).then((block) => {
      logHTTPRequest(req)
      return res.json(block)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  }
})

/* Get the current transaction pool */
app.get('/transaction/pool', (req, res) => {
  database.getTransactionPool().then((transactions) => {
    logHTTPRequest(req)
    return res.json(transactions)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get a transaction by its hash */
app.get('/transaction/:search', (req, res) => {
  const idx = req.params.search

  /* We need to check to make sure that they sent us 64 hexadecimal characters */
  if (!isHex(idx) || idx.length !== 64) {
    logHTTPError(req)
    return res.status(400).send()
  }

  database.getTransaction(idx).then((transaction) => {
    logHTTPRequest(req)
    return res.json(transaction)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(404).send()
  })
})

/* Get transaction inputs by its hash */
app.get('/transaction/:search/inputs', (req, res) => {
  const idx = req.params.search

  /* We need to check to make sure that they sent us 64 hexadecimal characters */
  if (!isHex(idx) || idx.length !== 64) {
    logHTTPError(req)
    return res.status(400).send()
  }

  database.getTransactionInputs(idx).then((inputs) => {
    if (inputs.length === 0) {
      logHTTPRequest(req)
      return res.status(404).send()
    }
    logHTTPRequest(req)
    return res.json(inputs)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get transaction outputs by its hash */
app.get('/transaction/:search/outputs', (req, res) => {
  const idx = req.params.search

  /* We need to check to make sure that they sent us 64 hexadecimal characters */
  if (!isHex(idx) || idx.length !== 64) {
    logHTTPError(req)
    return res.status(400).send()
  }

  database.getTransactionOutputs(idx).then((outputs) => {
    if (outputs.length === 0) {
      logHTTPRequest(req)
      return res.status(404).send()
    }
    logHTTPRequest(req)
    return res.json(outputs)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get all transactions hashes that have the supplied payment ID */
app.get('/transactions/:search', (req, res) => {
  const idx = req.params.search

  /* We need to check to make sure that they sent us 64 hexadecimal characters */
  if (!isHex(idx) || idx.length !== 64) {
    logHTTPError(req)
    return res.status(400).send()
  }

  database.getTransactionHashesByPaymentId(idx).then((hashes) => {
    logHTTPRequest(req)
    return res.json(hashes)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

app.get('/amounts', (req, res) => {
  database.getMixableAmounts(Config.defaultMixins).then((amounts) => {
    logHTTPRequest(req)
    return res.json(amounts)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(404).send()
  })
})

/* Get random outputs for transaction mixing */
app.post('/randomOutputs', (req, res) => {
  const amounts = req.body.amounts || []
  const mixin = toNumber(req.body.mixin) || Config.defaultMixins

  /* If it's not an array then we didn't follow the directions */
  if (!Array.isArray(amounts)) {
    logHTTPError(req, JSON.stringify(req.body))
    return res.status(400).send()
  }

  /* Check to make sure that we were passed numbers
     for each value in the array */
  for (var i = 0; i < amounts.length; i++) {
    var amount = toNumber(amounts[i])
    if (!amount) {
      logHTTPError(req, JSON.stringify(req.body))
      return res.status(400).send()
    }
    amounts[i] = amount
  }

  /* Go and try to get our random outputs */
  database.getRandomOutputsForAmounts(amounts, mixin).then((randomOutputs) => {
    logHTTPRequest(req, JSON.stringify(req.body))
    return res.json(randomOutputs)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Allow us to get just the information that a wallet needs to find
   the transactions that belong to the wallet */
app.post('/sync', (req, res) => {
  const lastKnownBlockHashes = req.body.lastKnownBlockHashes || []
  const blockCount = toNumber(req.body.blockCount) || 100
  const scanHeight = toNumber(req.body.scanHeight)

  /* If it's not an array then we didn't follow the directions */
  if (!Array.isArray(lastKnownBlockHashes) && !scanHeight) {
    logHTTPError(req, JSON.stringify(req.body))
    return res.status(400).send()
  }

  if (!scanHeight) {
    var searchHashes = []
    /* We need to loop through these and validate that we were
     given valid data to search through and not data that does
     not make any sense */
    lastKnownBlockHashes.forEach((elem) => {
    /* We need to check to make sure that they sent us 64 hexadecimal characters */
      if (elem.length === 64 && isHex(elem)) {
        searchHashes.push(elem)
      }
    })

    /* If, after sanitizing our input, we don't have any hashes
     to search for, then we're going to stop right here and
     say something about it */
    if (searchHashes.length === 0) {
      return res.status(400).send()
    }

    database.getWalletSyncData(searchHashes, blockCount).then((outputs) => {
      logHTTPRequest(req, JSON.stringify(req.body))
      return res.json(outputs)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  } else {
    database.getWalletSyncDataByHeight(scanHeight, blockCount).then((outputs) => {
      logHTTPRequest(req, JSON.stringify(req.body))
      return res.json(outputs)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  }
})

/* This is our catch all to return a 404-error */
app.all('*', (req, res) => {
  logHTTPError(req, 'Requested URL not Found (404)')
  return res.status(404).send()
})

app.listen(Config.httpPort, Config.bindIp, () => {
  log('HTTP server started on ' + Config.bindIp + ':' + Config.httpPort)
})
