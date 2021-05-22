global.expect = require('chai').expect

const originalCoreVersion = process.env.NYPL_CORE_VERSION
before(() => {
  // TODO: Setting a hard NYPL-Core version is temporary (although largely
  // future safe) and may be removed once the following is merged to
  // `master`:
  // https://github.com/NYPL/nypl-core/commit/e7548eaedd93c7dcbe17c82f61e299dfca1a9e13
  process.env.NYPL_CORE_VERSION = 'v1.37a'
})

after(() => {
  process.env.NYPL_CORE_VERSION = originalCoreVersion
})
