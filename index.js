// Copyright (c) 2018, TurtlePay Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Config = require('./config.json')
const DatabaseBackend = require('./lib/databaseBackend.js')

/* Set up our database connection */
const database = new DatabaseBackend({
  host: Config.mysql.host,
  port: Config.mysql.port,
  username: Config.mysql.username,
  password: Config.mysql.password,
  database: Config.mysql.database,
  connectionLimit: Config.mysql.connectionLimit
})

/*
database.getLastBlockHeader().then((block) => {
  console.log(block)
})

database.getTransactionPool().then((pool) => {
  console.log(pool)
})
*/

database.getTransaction('0079abddd7771e6a28c1b39d856552ac690d391ba39acfe5e8a39cbe8d42be74').then((result) => {
  console.log(result)
})
// 0079abddd7771e6a28c1b39d856552ac690d391ba39acfe5e8a39cbe8d42be74
