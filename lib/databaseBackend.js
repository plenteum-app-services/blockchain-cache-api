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
      return resolve(blocks[0])
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlockHeaderByHash = function (blockHash) {
  return new Promise((resolve, reject) => {
    this._query([
      'SELECT `blocks`.*,(SELECT COUNT(*) FROM `transactions` WHERE ',
      '`transactions`.`blockHash` = `blocks`.`hash`) AS `transactionCount` ',
      'FROM `blocks` WHERE `hash` = ? LIMIT 1'].join(''), [blockHash]).then((blocks) => {
      if (blocks.length === 0) {
        return reject(new Error('Requested block not found'))
      }
      return resolve(blocks[0])
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getBlockHeaderByHeight = function (height) {
  return new Promise((resolve, reject) => {
    this._query([
      'SELECT `blocks`.*,(SELECT COUNT(*) FROM `transactions` WHERE ',
      '`transactions`.`blockHash` = `blocks`.`hash`) AS `transactionCount` ',
      'FROM `blocks` WHERE `height` = ? LIMIT 1'].join(''), [height])
      .then((blocks) => {
        if (blocks.length === 0) {
          return reject(new Error('Requested block not found'))
        }
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

Self.prototype.getTransactionInputs = function (hash) {
  return new Promise((resolve, reject) => {
    this._query('SELECT * FROM `transaction_inputs` WHERE `txnHash` = ? ORDER BY `amount`, `keyImage`', [hash]).then((results) => {
      if (results.length === 0) {
        return resolve([])
      }

      for (var i = 0; i < results.length; i++) {
        delete results[i].txnHash
        results[i].type = results[i].type.toString(16)
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
        results[i].type = results[i].type.toString(16)
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
