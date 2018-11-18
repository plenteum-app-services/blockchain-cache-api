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
  log(util.format('[ERROR] (%s) %s: %s', req.ip, req.path, message))
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

/* Get information regarding the current cache height */
app.get('/height', (req, res) => {
  database.getLastBlockHeader().then((header) => {
    logHTTPRequest(req)
    return res.json({
      height: header.height
    })
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Get block information for the last 30 blocks before
   the specified block inclusive of the specified block */
app.get('/block/headers/:search', (req, res) => {
  const idx = req.params.search || -1

  /* If the caller did not specify a valid height then
     they most certainly didn't read the directions */
  if (idx === -1) {
    return res.status(400).send()
  }

  database.getBlocks(idx).then((blocks) => {
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
  if (idx.length === 64) {
    database.getBlockHeaderByHash(idx).then((header) => {
      logHTTPRequest(req)
      return res.json(header)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  } else {
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
  if (idx.length === 64) {
    database.getBlock(idx).then((block) => {
      logHTTPRequest(req)
      return res.json(block)
    }).catch((error) => {
      logHTTPError(req, error)
      return res.status(404).send()
    })
  } else {
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
  database.getTransactionHashesByPaymentId(idx).then((hashes) => {
    logHTTPRequest(req)
    return res.json(hashes)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(500).send()
  })
})

/* Allow us to get just the information that a wallet needs to find
   the transactions that belong to the wallet */
app.post('/sync', (req, res) => {
  const lastKnownBlockHashes = req.body.lastKnownBlockHashes || []
  const blockCount = req.body.blockCount || 100

  /* If you didn't supply an array of known block hashes then
     you didn't read the directions. We all know how that always
     ends up so let's shoot the caller a reminder */
  if (!Array.isArray(lastKnownBlockHashes) || lastKnownBlockHashes.length === 0) {
    return res.status(400).send()
  }

  database.getWalletSyncData(lastKnownBlockHashes, blockCount).then((outputs) => {
    logHTTPRequest(req, JSON.stringify(req.body))
    return res.json(outputs)
  }).catch((error) => {
    logHTTPError(req, error)
    return res.status(404).send()
  })
})

/* This is our catch all to return a 404-error */
app.all('*', (req, res) => {
  logHTTPError(req, 'Requested URL not Found (404)')
  return res.status(404).send()
})

app.listen(Config.httpPort, Config.bindIp, () => {
  log('HTTP server started on ' + Config.bindIp + ':' + Config.httpPort)
})
