var keytar = require('../build/Release/keytar.node')

function checkRequired(val, name) {
  if (!val || val.length <= 0) {
    throw new Error(name + ' is required.');
  }
}

function callbackPromise(callback) {
  if (typeof callback === 'function') {
    return new Promise(function(resolve, reject) {
      callback((err, val) => {
        if (err) {
          reject(err)
        } else {
          resolve(val)
        }
      })
    })
  } else {
    throw new Error('Callback required')
  }
}

module.exports = {
  getPassword: function (service, account) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')

    return callbackPromise(callback => keytar.getPassword(service, account, callback))
  },

  setPassword: function (service, account, password) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')
    checkRequired(password, 'Password')

    return callbackPromise(callback => keytar.setPassword(service, account, password, callback))
  },

  deletePassword: function (service, account) {
    checkRequired(service, 'Service')
    checkRequired(account, 'Account')

    return callbackPromise(callback => keytar.deletePassword(service, account, callback))
  },

  findPassword: function (service) {
    checkRequired(service, 'Service')

    return callbackPromise(callback => keytar.findPassword(service, callback))
  },

  findCredentials: function (service) {
    checkRequired(service, 'Service')

    return callbackPromise(callback => keytar.findCredentials(service, callback))
  }
}
