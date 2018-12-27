// Copyright (c) 2018, TurtlePay Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const MySQL = require('mysql')
const Random = require('random-number-csprng')

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

Self.prototype.getTransactionHashesByPaymentId = function (paymentId) {
  return new Promise((resolve, reject) => {
    this._query([
      'SELECT `txnHash` AS `hash`,`mixin`,`timestamp`,`fee`,`size`, ',
      '`totalOutputsAmount` AS `amount` ',
      'FROM `transactions` ',
      'WHERE `paymentId` = ? ',
      'ORDER BY `timestamp`'].join(''), [ paymentId ]).then((results) => {
      return resolve(results)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getTransaction = function (hash) {
  return new Promise((resolve, reject) => {
    var result = {}

    this._query('SELECT * FROM `transactions` WHERE `transactions`.`txnHash` = ?', [ hash ]).then((transactions) => {
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
        nonce: txn.nonce,
        publicKey: txn.publicKey
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

      return this.getLastBlockHeader()
    }).then((header) => {
      result.block.depth = header.height - result.block.height
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

Self.prototype.getBlocks = function (height, count) {
  return new Promise((resolve, reject) => {
    /* We return just 30 blocks inclusive of our height */
    const cnt = count || 30
    const min = height - (cnt - 1)
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

Self.prototype.getWalletSyncDataByHeight = function (scanHeight, blockCount) {
  scanHeight = scanHeight || 0
  blockCount = blockCount || 100

  /* We max this out at 100 blocks per call as otherwise we're returning
     a massive amount of data that is just... well... massive */
  if (blockCount > 100) {
    blockCount = 100
  } else if (blockCount < 1) { /* It's kind of pointless to request 0 blocks */
    blockCount = 1
  }

  const results = []
  const transactionsIdx = {}
  const transactions = []
  const blocksIdx = {}

  return new Promise((resolve, reject) => {
    /* Go get the blocks from the scanHeight provided */
    const min = scanHeight
    const max = min + blockCount

    this._query([
      'SELECT `hash` AS `blockHash`, `height`, `timestamp`  ',
      'FROM `blocks` ',
      'WHERE `height` >= ? AND `height` < ? ',
      'ORDER BY `height`'
    ].join(''), [ min, max ]).then((blocks) => {
      const promises = []

      /* We have the blocks, we need to go get the transactions
         for those blocks */
      for (var i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        block.transactions = []
        blocksIdx[block.blockHash] = results.length
        results.push(block)

        promises.push(this._query([
          'SELECT `blockHash`, `txnHash`, `publicKey`, ',
          '`unlockTime`, `paymentId` ',
          'FROM `transactions` WHERE `blockHash` = ?'
        ].join(''), [ block.blockHash ]))
      }

      return Promise.all(promises)
    }).then((txnSets) => {
      const promises = []

      /* Loop through the transactions that came back out and toss
         them on the block they belong to */
      for (var i = 0; i < txnSets.length; i++) {
        for (var j = 0; j < txnSets[i].length; j++) {
          var txn = txnSets[i][j]
          const blockIdx = blocksIdx[txn.blockHash]

          /* We need to store this to make it easier to find
             where we need to insert the data later */
          transactionsIdx[txn.txnHash] = { blockIdx: blockIdx, txnIdx: results[blockIdx].transactions.length }
          transactions.push(txn.txnHash)

          /* Append the transaction to the block */
          results[blockIdx].transactions.push({
            hash: txn.txnHash,
            publicKey: txn.publicKey,
            unlockTime: txn.unlockTime,
            paymentId: txn.paymentId,
            inputs: [],
            outputs: []
          })

          /* Let's go get the transaction inputs */
          promises.push(this._query([
            'SELECT `txnHash`, `keyImage`, `amount`, `type` ',
            'FROM `transaction_inputs` ',
            'WHERE `txnHash` = ? ORDER BY `amount`'
          ].join(''), [ txn.txnHash ]))
        }
      }

      return Promise.all(promises)
    }).then((inputSets) => {
      const promises = []

      /* Now that we got out transaction inputs back we
         need to push them into the transaction inputs
         in their related blocks */
      for (var i = 0; i < inputSets.length; i++) {
        for (var j = 0; j < inputSets[i].length; j++) {
          const input = inputSets[i][j]
          const transactionIdx = transactionsIdx[input.txnHash]

          results[transactionIdx.blockIdx].transactions[transactionIdx.txnIdx].inputs.push({
            keyImage: (input.keyImage.length !== 0) ? input.keyImage : false,
            amount: input.amount,
            type: input.type.toString(16).padStart(2, '0')
          })
        }
      }

      /* Now we can go get our transaction outputs */
      for (i = 0; i < transactions.length; i++) {
        promises.push(this._query([
          'SELECT `txnHash`, `outputIndex`, `globalIndex`, ',
          '`key`, `amount`, `type` ',
          'FROM `transaction_outputs` ',
          'WHERE `txnHash` = ? ',
          'ORDER BY `outputIndex`'
        ].join(''), [ transactions[i] ]))
      }

      return Promise.all(promises)
    }).then((outputSets) => {
      /* Now that we got out transaction outputs back we
         need to push them into the transaction outputs
         in their related blocks */
      for (var i = 0; i < outputSets.length; i++) {
        for (var j = 0; j < outputSets[i].length; j++) {
          const output = outputSets[i][j]
          const transactionIdx = transactionsIdx[output.txnHash]

          results[transactionIdx.blockIdx].transactions[transactionIdx.txnIdx].outputs.push({
            index: output.outputIndex,
            globalIndex: output.globalIndex,
            key: output.key,
            amount: output.amount,
            type: output.type.toString(16).padStart(2, '0')
          })
        }
      }
    }).then(() => {
      /* That's it, we're done here, spit it back to the caller */
      return resolve(results)
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

  const results = []
  const transactionsIdx = {}
  const transactions = []
  const blocksIdx = {}

  return new Promise((resolve, reject) => {
    if (!Array.isArray(knownBlockHashes)) return reject(new Error('You must supply an array of block hashes'))
    if (knownBlockHashes.length === 0) return reject(new Error('You must supply at least one known block hash'))

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

      /* Go get the blocks that are within the range */
      return this._query([
        'SELECT `hash` AS `blockHash`, `height`, `timestamp`  ',
        'FROM `blocks` ',
        'WHERE `height` >= ? AND `height` < ? ',
        'ORDER BY `height`'
      ].join(''), [ min, max ])
    }).then((blocks) => {
      const promises = []

      /* We have the blocks, we need to go get the transactions
         for those blocks */
      for (var i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        block.transactions = []
        blocksIdx[block.blockHash] = results.length
        results.push(block)

        promises.push(this._query([
          'SELECT `blockHash`, `txnHash`, `publicKey`, ',
          '`unlockTime`, `paymentId` ',
          'FROM `transactions` WHERE `blockHash` = ?'
        ].join(''), [ block.blockHash ]))
      }

      return Promise.all(promises)
    }).then((txnSets) => {
      const promises = []

      /* Loop through the transactions that came back out and toss
         them on the block they belong to */
      for (var i = 0; i < txnSets.length; i++) {
        for (var j = 0; j < txnSets[i].length; j++) {
          var txn = txnSets[i][j]
          const blockIdx = blocksIdx[txn.blockHash]

          /* We need to store this to make it easier to find
             where we need to insert the data later */
          transactionsIdx[txn.txnHash] = { blockIdx: blockIdx, txnIdx: results[blockIdx].transactions.length }
          transactions.push(txn.txnHash)

          /* Append the transaction to the block */
          results[blockIdx].transactions.push({
            hash: txn.txnHash,
            publicKey: txn.publicKey,
            unlockTime: txn.unlockTime,
            paymentId: txn.paymentId,
            inputs: [],
            outputs: []
          })

          /* Let's go get the transaction inputs */
          promises.push(this._query([
            'SELECT `txnHash`, `keyImage`, `amount`, `type` ',
            'FROM `transaction_inputs` ',
            'WHERE `txnHash` = ? ORDER BY `amount`'
          ].join(''), [ txn.txnHash ]))
        }
      }

      return Promise.all(promises)
    }).then((inputSets) => {
      const promises = []

      /* Now that we got out transaction inputs back we
         need to push them into the transaction inputs
         in their related blocks */
      for (var i = 0; i < inputSets.length; i++) {
        for (var j = 0; j < inputSets[i].length; j++) {
          const input = inputSets[i][j]
          const transactionIdx = transactionsIdx[input.txnHash]

          results[transactionIdx.blockIdx].transactions[transactionIdx.txnIdx].inputs.push({
            keyImage: (input.keyImage.length !== 0) ? input.keyImage : false,
            amount: input.amount,
            type: input.type.toString(16).padStart(2, '0')
          })
        }
      }

      /* Now we can go get our transaction outputs */
      for (i = 0; i < transactions.length; i++) {
        promises.push(this._query([
          'SELECT `txnHash`, `outputIndex`, `globalIndex`, ',
          '`key`, `amount`, `type` ',
          'FROM `transaction_outputs` ',
          'WHERE `txnHash` = ? ',
          'ORDER BY `outputIndex`'
        ].join(''), [ transactions[i] ]))
      }

      return Promise.all(promises)
    }).then((outputSets) => {
      /* Now that we got out transaction outputs back we
         need to push them into the transaction outputs
         in their related blocks */
      for (var i = 0; i < outputSets.length; i++) {
        for (var j = 0; j < outputSets[i].length; j++) {
          const output = outputSets[i][j]
          const transactionIdx = transactionsIdx[output.txnHash]

          results[transactionIdx.blockIdx].transactions[transactionIdx.txnIdx].outputs.push({
            index: output.outputIndex,
            globalIndex: output.globalIndex,
            key: output.key,
            amount: output.amount,
            type: output.type.toString(16).padStart(2, '0')
          })
        }
      }
    }).then(() => {
      /* That's it, we're done here, spit it back to the caller */
      return resolve(results)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getTransactionInputs = function (hash) {
  return new Promise((resolve, reject) => {
    this._query('SELECT * FROM `transaction_inputs` WHERE `txnHash` = ? ORDER BY `amount`, `keyImage`', [ hash ]).then((results) => {
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
    this._query('SELECT * FROM `transaction_outputs` WHERE `txnHash` = ? ORDER BY `outputIndex`', [ hash ]).then((results) => {
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

Self.prototype.getRandomOutputsForAmounts = function (amounts, mixin) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(amounts)) return reject(new Error('You must supply an array of amounts'))
    mixin = mixin || 0

    var promises = []
    for (var i = 0; i < amounts.length; i++) {
      promises.push(this.getRandomOutputs(amounts[i], mixin))
    }

    Promise.all(promises).then((results) => {
      return resolve(results)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getRandomOutputs = function (amount, mixin) {
  /* We are always going to return one extra mixin, just in case
     we accidentally grab the output that is the output we are
     trying to mix */
  mixin += 1

  return new Promise((resolve, reject) => {
    /* Find out what the maximum globalIndex is for the amount */
    this._query([
      'SELECT `globalIndex` FROM `transaction_outputs_index_maximums` ',
      'WHERE `amount` = ?'
    ].join(''), [amount]).then(async function (results) {
      if (results.length === 0) {
        return reject(new Error('No available mixins for the specified amount'))
      }

      const minimum = 0
      const maximum = results[0].globalIndex

      /* If there aren't enough mixins available, then we need to get out of here */
      if (maximum < mixin) {
        return reject(new Error('Not enough mixins available to complete the request'))
      }

      /* We need to get enough random numbers to complete the request */
      var rnds = []
      while (rnds.length !== mixin) {
        var rand = await Random(minimum, maximum)
        if (rnds.indexOf(rand) === -1) {
          rnds.push(rand)
        }
      }

      return rnds
    }).then((indexes) => {
      /* Join the returned random numbers together */
      const globalIndexes = indexes.join(',')

      /* Get the output for the list of globalIndexes we generated */
      return this._query([
        'SELECT `globalIndex` AS `global_amount_index`, `key` AS `out_key` ',
        'FROM `transaction_outputs` WHERE `amount` = ? AND `globalIndex` IN (',
        globalIndexes,
        ') ORDER BY `globalIndex` ASC'
      ].join(''), [amount])
    }).then((results) => {
      if (results.length === mixin) {
        return resolve({ amount: amount, outs: results })
      } else {
        return reject(new Error('There are not enough mixins available to complete the request'))
      }
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.getMixableAmounts = function (mixin) {
  mixin = mixin || 3

  return new Promise((resolve, reject) => {
    this._query([
      'SELECT `toim`.`amount`, `toim`.`globalIndex` + 1 AS `outputs`, `t`.`timestamp`, `b`.`height`, `t`.`txnHash`, `b`.`hash` ',
      'FROM `transaction_outputs_index_maximums` AS `toim` ',
      'LEFT JOIN `transaction_outputs` AS `to` ON `to`.`amount` = `toim`.`amount` AND `to`.`globalIndex` = ? ',
      'LEFT JOIN `transactions` AS `t` ON `t`.`txnHash` = `to`.`txnHash` ',
      'LEFT JOIN `blocks` AS `b` ON `b`.`hash` = `t`.`blockHash` ',
      'ORDER BY `toim`.`amount`'
    ].join(''), [mixin]).then((results) => {
      if (results.length === 0) {
        return resolve([])
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
