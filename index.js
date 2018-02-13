const Item = require('./lib/models/Item')
const Bib = require('./lib/models/Bib')
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
