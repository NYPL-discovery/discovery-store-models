const Item = require('./lib/models/Item')
const Bib = require('./lib/models/Bib')
const db = require('./lib/db')

module.exports = {
  Item,
  Bib,
  connect: db.setConnectionUri,
  connected: db.connected,
  _db: db
}
