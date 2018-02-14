const Item = require('./lib/models/item')
const Bib = require('./lib/models/bib')
const db = require('./lib/db')
const logger = require('./lib/logger')

module.exports = {
  Item,
  Bib,
  connect: db.setConnectionUri,
  connected: db.connected,
  setLogLevel: (level) => {
    logger.transports.console.level = level
  },
  _db: db
}
