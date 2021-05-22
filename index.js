const Item = require('./lib/models/item')
const Bib = require('./lib/models/bib')
const NyplSourceMapper = require('./lib/nypl-source-mapper')
const db = require('./lib/db')
const logger = require('./lib/logger')

module.exports = {
  Item,
  Bib,
  NyplSourceMapper,
  connect: db.setConnectionUri,
  connected: db.connected,
  setLogLevel: (level) => {
    logger.transports.console.level = level
  },
  _db: db
}
