const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const Bib = require('../index').Bib

function bibFixturePath (id) {
  return path.join(__dirname, `./data/${id}.json`)
}

let getBibByFixture = function (id) {
  if (fs.existsSync(bibFixturePath(id))) {
    // The fixture contains json matching the raw aggregate json returned by
    // db.resources.bib
    let data = JSON.parse(fs.readFileSync(bibFixturePath(id)))
    const bib = Bib.fromDbJsonResult(data)

    return Promise.resolve(bib)
  } else console.log(id + ' not found on disk')
}

function enable () {
  sinon.stub(Bib, 'byId').callsFake(getBibByFixture)
}

function disable () {
  Bib.byId.restore()
}

module.exports = {
  enable,
  disable
}
