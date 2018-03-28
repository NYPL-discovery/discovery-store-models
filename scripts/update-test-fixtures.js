/*
 *  Tool for updating fixtures on disk with whatever's presently in db.
 *
 *  Useage:
 *
 *  This will update all fixtures against configured db:
 *    node scripts/update-test-fixtures --profile [profile] --envfile [creds file]
 *
 *  This will update a single fixture by [bib] id:
 *    node scripts/update-test-fixtures --id [id] --profile [profile] --envfile [creds file]
 *
 *  For example, this updates fixture for 'b10781594' using qa creds
 *    node scripts/update-test-fixtures --id b10781594 --profile nypl-sandbox --envfile config/qa.env
 */

const path = require('path')
const fs = require('fs')
// const aws = require('aws-sdk')
const dotenv = require('dotenv')

const DiscoveryModels = require('../index')
const db = require('../lib/db')

function bibFixturePath (id) {
  return path.join(__dirname, `../test/data/${id}.json`)
}

/*
 * Fetch a single bib from db and write to fixtures dir
 */
function updateBib (id) {
  return db.resources.bib(id).then((rawBib) => {
  // return DiscoveryModels.Bib.byId(id).then((bib) => {
    fs.writeFileSync(bibFixturePath(id), JSON.stringify(rawBib, null, 2))
    return Promise.resolve(path)
  })
}

/*
 * Re-fetch all previously saved bibs from db
 */
function updateAllBibs () {
  return new Promise((resolve, reject) => {
    fs.readdir(path.join('test/data'), (err, paths) => {
      if (err) console.error(err)

      let bibIds = paths
        .filter((path) => /(\w+).json$/.test(path))
        .map((path) => path.match(/(\w+).json$/)[1])

      return Promise.all(bibIds.map((id) => updateBib(id)))
    })
  })
}

const argv = require('optimist').argv

// Require --envfile [ENVFILE] so that we have creds to connect to the deebee
if (!argv.envfile) throw new Error('--envfile config/[environment].env is a required flag')

// Ensure necessary env variables loaded
dotenv.config({ path: argv.envfile })

// Register connection uri with db lib:
DiscoveryModels.connect(process.env.DISCOVERY_STORE_CONNECTION_URI)

// Update just one by --id ?
if (argv.id) {
  updateBib(argv.id).then(() => {
    console.log('Finished updating ' + argv.id)
    process.exit()
  })

// Otherwise, update all test fixtures
} else {
  updateAllBibs().then((paths) => {
    console.log(`Finished updating ${paths.length} bib fixtures`)
    process.exit()
  })
}
