// Copyright (c) 2018, TurtlePay Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const MySQL = require('mysql')

const Self = function (opts) {
  opts = opts || {}
  if (!(this instanceof Self)) return new Self(opts)
  this.host = opts.host || '127.0.0.1'
  this.port = opts.port || 3306
  this.username = opts.username || ''
  this.password = opts.password || ''
  this.database = opts.database || ''
  this.socketPath = opts.socketPath || false
  this.connectionLimit = opts.connectionLimit || 10

  this.db = MySQL.createPool({
    connectionLimit: this.connectionLimit,
    host: this.host,
    port: this.port,
    user: this.username,
    password: this.password,
    database: this.database,
    socketPath: this.socketPath
  })
}

Self.prototype.getLastBlockHeader = function () {
  return new Promise((resolve, reject) => {
    this._query([
      'SELECT `blocks`.*,(SELECT COUNT(*) FROM `transactions` WHERE ',
      '`transactions`.`blockHash` = `blocks`.`hash`) AS `transactionCount` ',
      'FROM `blocks` ORDER BY `height` DESC LIMIT 1'].join(''), []).then((blocks) => {
      if (blocks.length === 0) {
        return reject(new Error('No blocks found in backend storage'))
      }
      /* We're at the top as far as we know, so our depth is 0 */
      blocks[0].depth = 0
      return resolve(blocks[0])
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlockHeaderByHash = function (blockHash) {
  return new Promise((resolve, reject) => {
    var topHeight
    this.getLastBlockHeader().then((block) => {
      topHeight = block.height
      return this._query([
        'SELECT `blocks`.*,(SELECT COUNT(*) FROM `transactions` WHERE ',
        '`transactions`.`blockHash` = `blocks`.`hash`) AS `transactionCount` ',
        'FROM `blocks` WHERE `hash` = ? LIMIT 1'].join(''), [blockHash])
    }).then((blocks) => {
      if (blocks.length === 0) {
        return reject(new Error('Requested block not found'))
      }
      blocks[0].depth = topHeight - blocks[0].height
      return resolve(blocks[0])
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlockHeaderByHeight = function (height) {
  return new Promise((resolve, reject) => {
    var topHeight
    this.getLastBlockHeader().then((block) => {
      topHeight = block.height
      return this._query([
        'SELECT `blocks`.*,(SELECT COUNT(*) FROM `transactions` WHERE ',
        '`transactions`.`blockHash` = `blocks`.`hash`) AS `transactionCount` ',
        'FROM `blocks` WHERE `height` = ? LIMIT 1'].join(''), [height])
    }).then((blocks) => {
      if (blocks.length === 0) {
        return reject(new Error('Requested block not found'))
      }
      blocks[0].depth = topHeight - blocks[0].height
      return resolve(blocks[0])
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlockHash = function (height) {
  return new Promise((resolve, reject) => {
    this.getBlockHeaderByHeight(height).then((block) => {
      return resolve(block.hash)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlockHeight = function (hash) {
  return new Promise((resolve, reject) => {
    this.getBlockHeaderByHash(hash).then((block) => {
      return resolve(block.height)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlockCount = function () {
  return new Promise((resolve, reject) => {
    this._query('SELECT COUNT(*) AS `cnt` FROM `blocks`', []).then((results) => {
      if (results.length !== 1) {
        return reject(new Error('Error when requesting total block count from backend database'))
      }
      return resolve(results[0].cnt)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getTransactionPool = function () {
  return new Promise((resolve, reject) => {
    this._query('SELECT * FROM `transaction_pool`', []).then((results) => {
      if (results.length === 0) {
        return resolve([])
      }
      return resolve(results)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getTransaction = function (hash) {
  return new Promise((resolve, reject) => {
    var result = {}

    this._query('SELECT * FROM `transactions` WHERE `transactions`.`txnHash` = ?', [hash]).then((transactions) => {
      if (transactions.length !== 1) {
        return reject(new Error('Transaction not found'))
      }

      var txn = transactions[0]
      result.tx = {
        amount_out: txn.totalOutputsAmount,
        fee: txn.fee,
        hash: txn.txnHash,
        mixin: txn.mixin,
        paymentId: txn.paymentId,
        size: txn.size,
        extra: txn.extra.toString('hex'),
        unlock_time: txn.unlockTime,
        nonce: txn.nonce
      }

      return this.getBlockHeaderByHash(txn.blockHash)
    }).then((block) => {
      result.block = {
        cumul_size: block.size,
        difficulty: block.difficulty,
        hash: block.hash,
        height: block.height,
        timestamp: block.timestamp,
        tx_count: block.transactionCount
      }

      return this.getTransactionInputs(result.tx.hash)
    }).then((inputs) => {
      result.tx.inputs = inputs

      return this.getTransactionOutputs(result.tx.hash)
    }).then((outputs) => {
      result.tx.outputs = outputs
    }).then(() => {
      return resolve(result)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlock = function (hash) {
  return new Promise((resolve, reject) => {
    var result
    var topHeight
    this.getLastBlockHeader().then((header) => {
      topHeight = header.height
      return this.getBlockHeaderByHash(hash)
    }).then((block) => {
      result = block
      result.depth = topHeight - block.height
      return this._query([
        'SELECT `totalOutputsAmount` AS `amount_out`, `fee`, `txnHash` AS `hash`, `size` ',
        'FROM `transactions` WHERE `blockHash` = ?'
      ].join(''), [hash])
    }).then((transactions) => {
      result.transactions = transactions
    }).then(() => {
      return resolve(result)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlocks = function (height) {
  return new Promise((resolve, reject) => {
    /* We return just 30 blocks inclusive of our height */
    const min = height - 29
    const max = height
    this._query([
      'SELECT `size`, `difficulty`, `hash`, `height`, `timestamp`, ',
      '(SELECT COUNT(*) FROM `transactions` WHERE `transactions`.`blockHash` = `blocks`.`hash`) AS `tx_count` ',
      'FROM `blocks` WHERE `height` BETWEEN ? AND ? ',
      'ORDER BY `height` DESC'].join(''), [ min, max ])
      .then((blocks) => {
        return resolve(blocks)
      }).catch((error) => {
        return reject(error)
      })
  })
}

Self.prototype.getWalletSyncData = function (knownBlockHashes, blockCount) {
  blockCount = blockCount || 100

  /* We max this out at 100 blocks per call as otherwise we're returning
     a massive amount of data that is just... well... massive */
  if (blockCount > 100) {
    blockCount = 100
  } else if (blockCount < 1) { /* It's kind of pointless to request 0 blocks */
    blockCount = 1
  }

  return new Promise((resolve, reject) => {
    var criteria = []
    for (var i = 0; i < knownBlockHashes.length; i++) {
      criteria.push('`hash` = ?')
    }
    criteria = criteria.join(' OR ')

    /* Find out the highest block that we know about */
    this._query('SELECT `height` FROM `blocks` WHERE ' + criteria + ' ORDER BY `height` DESC LIMIT 1', knownBlockHashes).then((results) => {
      if (results.length === 0) {
        return reject(new Error('Could not find any blocks matching the the supplied known block hashes'))
      }

      const min = results[0].height
      const max = min + blockCount

      /* Let's go get everything we need between min and max height */
      return this._query([
        'SELECT `b`.`hash` AS `blockHash`, `b`.`height`, `b`.`timestamp`, ',
        '`t`.`txnHash`, `t`.`publicKey`, `t`.`unlockTime`, ',
        '`to`.`outputIndex`, `to`.`globalIndex`, `to`.`key` AS `outputKey`, `to`.`amount`, ',
        '`t`.`paymentId`, `to`.`type` ',
        'FROM `transaction_outputs` AS `to`',
        'LEFT JOIN `transactions` AS `t` ON `t`.`txnHash` = `to`.`txnHash` ',
        'LEFT JOIN `blocks` AS `b` ON `b`.`hash` = `t`.`blockHash` ',
        'WHERE `b`.`height` >= ? AND `b`.`height` < ? ',
        'ORDER BY `b`.`height`, `t`.`txnHash`'
      ].join(''), [min, max])
    }).then((outputs) => {
      for (var i = 0; i < outputs.length; i++) {
        /* Convert the type from decimal back to hexadecimal and padded to two positions */
        outputs[i].type = outputs[i].type.toString(16).padStart(2, '0')
      }
      return resolve(outputs)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getTransactionInputs = function (hash) {
  return new Promise((resolve, reject) => {
    this._query('SELECT * FROM `transaction_inputs` WHERE `txnHash` = ? ORDER BY `amount`, `keyImage`', [hash]).then((results) => {
      if (results.length === 0) {
        return resolve([])
      }

      for (var i = 0; i < results.length; i++) {
        delete results[i].txnHash
        /* Convert this from decimal back to hexadecimal and padded to two positions */
        results[i].type = results[i].type.toString(16).padStart(2, '0')
      }

      return resolve(results)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getTransactionOutputs = function (hash) {
  return new Promise((resolve, reject) => {
    this._query('SELECT * FROM `transaction_outputs` WHERE `txnHash` = ? ORDER BY `outputIndex`', [hash]).then((results) => {
      if (results.length === 0) {
        return resolve([])
      }

      for (var i = 0; i < results.length; i++) {
        delete results[i].txnHash
        /* Convert this from decimal back to hexadecimal and padded to two positions */
        results[i].type = results[i].type.toString(16).padStart(2, '0')
      }

      return resolve(results)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype._query = function (query, args) {
  return new Promise((resolve, reject) => {
    this.db.query(query, args, (error, results, fields) => {
      if (error) {
        return reject(error)
      }
      return resolve(results)
    })
  })
}

module.exports = Self
