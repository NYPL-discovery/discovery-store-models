// Thrown when an fetch attempt made before connection initialization
class DbNotConnectedError extends Error {
  constructor (message) {
    super()
    this.name = 'DbNotConnectedError'
    this.message = message
  }
}

module.exports = { DbNotConnectedError }
