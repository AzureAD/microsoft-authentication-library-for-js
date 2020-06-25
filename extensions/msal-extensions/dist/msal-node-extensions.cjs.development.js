'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var util = require('util');
var process = require('process');
var path = require('path');
var keytar = require('keytar');

// A type of promise-like that resolves synchronously and supports only one observer
const _Pact = /*#__PURE__*/(function() {
	function _Pact() {}
	_Pact.prototype.then = function(onFulfilled, onRejected) {
		const result = new _Pact();
		const state = this.s;
		if (state) {
			const callback = state & 1 ? onFulfilled : onRejected;
			if (callback) {
				try {
					_settle(result, 1, callback(this.v));
				} catch (e) {
					_settle(result, 2, e);
				}
				return result;
			} else {
				return this;
			}
		}
		this.o = function(_this) {
			try {
				const value = _this.v;
				if (_this.s & 1) {
					_settle(result, 1, onFulfilled ? onFulfilled(value) : value);
				} else if (onRejected) {
					_settle(result, 1, onRejected(value));
				} else {
					_settle(result, 2, value);
				}
			} catch (e) {
				_settle(result, 2, e);
			}
		};
		return result;
	};
	return _Pact;
})();

// Settles a pact synchronously
function _settle(pact, state, value) {
	if (!pact.s) {
		if (value instanceof _Pact) {
			if (value.s) {
				if (state & 1) {
					state = value.s;
				}
				value = value.v;
			} else {
				value.o = _settle.bind(null, pact, state);
				return;
			}
		}
		if (value && value.then) {
			value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
			return;
		}
		pact.s = state;
		pact.v = value;
		const observer = pact.o;
		if (observer) {
			observer(pact);
		}
	}
}

function _isSettledPact(thenable) {
	return thenable instanceof _Pact && thenable.s & 1;
}

const _iteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator"))) : "@@iterator";

const _asyncIteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.asyncIterator || (Symbol.asyncIterator = Symbol("Symbol.asyncIterator"))) : "@@asyncIterator";

// Asynchronously implement a generic for loop
function _for(test, update, body) {
	var stage;
	for (;;) {
		var shouldContinue = test();
		if (_isSettledPact(shouldContinue)) {
			shouldContinue = shouldContinue.v;
		}
		if (!shouldContinue) {
			return result;
		}
		if (shouldContinue.then) {
			stage = 0;
			break;
		}
		var result = body();
		if (result && result.then) {
			if (_isSettledPact(result)) {
				result = result.s;
			} else {
				stage = 1;
				break;
			}
		}
		if (update) {
			var updateValue = update();
			if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
				stage = 2;
				break;
			}
		}
	}
	var pact = new _Pact();
	var reject = _settle.bind(null, pact, 2);
	(stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
	return pact;
	function _resumeAfterBody(value) {
		result = value;
		do {
			if (update) {
				updateValue = update();
				if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
					updateValue.then(_resumeAfterUpdate).then(void 0, reject);
					return;
				}
			}
			shouldContinue = test();
			if (!shouldContinue || (_isSettledPact(shouldContinue) && !shouldContinue.v)) {
				_settle(pact, 1, result);
				return;
			}
			if (shouldContinue.then) {
				shouldContinue.then(_resumeAfterTest).then(void 0, reject);
				return;
			}
			result = body();
			if (_isSettledPact(result)) {
				result = result.v;
			}
		} while (!result || !result.then);
		result.then(_resumeAfterBody).then(void 0, reject);
	}
	function _resumeAfterTest(shouldContinue) {
		if (shouldContinue) {
			result = body();
			if (result && result.then) {
				result.then(_resumeAfterBody).then(void 0, reject);
			} else {
				_resumeAfterBody(result);
			}
		} else {
			_settle(pact, 1, result);
		}
	}
	function _resumeAfterUpdate() {
		if (shouldContinue = test()) {
			if (shouldContinue.then) {
				shouldContinue.then(_resumeAfterTest).then(void 0, reject);
			} else {
				_resumeAfterTest(shouldContinue);
			}
		} else {
			_settle(pact, 1, result);
		}
	}
}

// Asynchronously call a function and send errors to recovery continuation
function _catch(body, recover) {
	try {
		var result = body();
	} catch(e) {
		return recover(e);
	}
	if (result && result.then) {
		return result.then(void 0, recover);
	}
	return result;
}

// Asynchronously await a promise and pass the result to a finally continuation
function _finallyRethrows(body, finalizer) {
	try {
		var result = body();
	} catch (e) {
		return finalizer(true, e);
	}
	if (result && result.then) {
		return result.then(finalizer.bind(null, false), finalizer.bind(null, true));
	}
	return finalizer(false, result);
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var Constants = {
  /**
   * An existing file was the target of an operation that required that the target not exist
   */
  EEXIST_ERROR: "EEXIST",

  /**
   * No such file or directory: Commonly raised by fs operations to indicate that a component
   * of the specified pathname does not exist. No entity (file or directory) could be found
   * by the given path
   */
  ENOENT_ERROR: "ENOENT",

  /**
   * Default service name for using MSAL Keytar
   */
  DEFAULT_SERVICE_NAME: "msal-node-extensions"
};

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var PersistenceError = /*#__PURE__*/function (_Error) {
  _inheritsLoose(PersistenceError, _Error);

  function PersistenceError(errorCode, errorMessage) {
    var _this;

    var errorString = errorMessage ? errorCode + ": " + errorMessage : errorCode;
    _this = _Error.call(this, errorString) || this;
    Object.setPrototypeOf(_assertThisInitialized(_this), PersistenceError.prototype);
    _this.errorCode = errorCode;
    _this.errorMessage = errorMessage;
    _this.name = "PersistenceError";
    return _this;
  }

  PersistenceError.createFileSystemError = function createFileSystemError(errorCode, errorMessage) {
    return new PersistenceError(errorCode, errorMessage);
  };

  PersistenceError.createLibSecretError = function createLibSecretError(errorCode, errorMessage) {
    var updatedErrorMessage = "Error accessing Gnome Keyring: " + errorCode + "- " + errorMessage;
    return new PersistenceError("GnomeKeyringError", updatedErrorMessage);
  };

  PersistenceError.createKeychainPersistenceError = function createKeychainPersistenceError(errorCode, errorMessage) {
    var updatedErrorMessage = "Error accessing Keychain: " + errorCode + "- " + errorMessage;
    return new PersistenceError("KeychainError", updatedErrorMessage);
  };

  PersistenceError.createFilePersistenceWithDPAPIError = function createFilePersistenceWithDPAPIError(errorCode, errorMessage) {
    var updatedErrorMessage = "Error accessing DPAPI encrypted file: " + errorCode + "- " + errorMessage;
    return new PersistenceError("DPAPIEncryptedFileError", updatedErrorMessage);
  };

  PersistenceError.createCrossPlatformLockError = function createCrossPlatformLockError(errorCode, errorMessage) {
    var updatedErrorMessage = "Error acquiring lock: " + errorCode + "- " + errorMessage;
    return new PersistenceError("CrossPlatformLockError", updatedErrorMessage);
  };

  return PersistenceError;
}( /*#__PURE__*/_wrapNativeSuper(Error));

/**
 * Cross-process lock that works on all platforms.
 */

var CrossPlatformLock = /*#__PURE__*/function () {
  function CrossPlatformLock(lockFilePath, lockOptions) {
    this.lockFilePath = lockFilePath;
    this.retryNumber = lockOptions ? lockOptions.retryNumber : 500;
    this.retryDelay = lockOptions ? lockOptions.retryDelay : 100;
  }

  var _proto = CrossPlatformLock.prototype;

  _proto.lock = function lock() {
    try {
      var _exit2 = false,
          _interrupt2 = false;

      var _this2 = this;

      var processId = process.pid.toString();
      var _tryCount = 0;
      return Promise.resolve(_for(function () {
        return !(_interrupt2 || _exit2) && _tryCount < _this2.retryNumber;
      }, function () {
        return _tryCount++;
      }, function () {
        return _catch(function () {
          console.log("Pid " + process.pid + " trying to acquire lock");
          var openPromise = util.promisify(fs.open);
          return Promise.resolve(openPromise(_this2.lockFilePath, "wx+")).then(function (_openPromise) {
            _this2.lockFileDescriptor = _openPromise;
            console.log("Pid " + process.pid + " acquired lock");
            var writePromise = util.promisify(fs.write);
            return Promise.resolve(writePromise(_this2.lockFileDescriptor, processId)).then(function () {
              _interrupt2 = true;
            });
          });
        }, function (err) {
          return function () {
            if (err.code == Constants.EEXIST_ERROR) {
              console.log(err);
              return Promise.resolve(_this2.sleep(_this2.retryDelay)).then(function () {});
            } else {
              throw PersistenceError.createCrossPlatformLockError(err.code, err.message);
            }
          }();
        });
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.unlock = function unlock() {
    try {
      var _this4 = this;

      return Promise.resolve(_catch(function () {
        // delete lock file
        var unlinkPromise = util.promisify(fs.unlink);
        return Promise.resolve(unlinkPromise(_this4.lockFilePath)).then(function () {
          var closePromise = util.promisify(fs.close);
          return Promise.resolve(closePromise(_this4.lockFileDescriptor)).then(function () {});
        });
      }, function (err) {
        if (err.code == Constants.ENOENT_ERROR) {
          console.log("Lockfile does not exist");
        } else {
          throw PersistenceError.createCrossPlatformLockError(err.code, err.message);
        }
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.sleep = function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  };

  return CrossPlatformLock;
}();

var PersistenceCachePlugin = /*#__PURE__*/function () {
  function PersistenceCachePlugin(persistence, lockOptions) {
    this.persistence = persistence;
    this.lockFilePath = this.persistence.getFilePath() + ".lockfile";
    this.lastSync = 0;
    this.currentCache = null;
    this.lockOptions = lockOptions;
  }

  var _proto = PersistenceCachePlugin.prototype;

  _proto.readFromStorage = function readFromStorage() {
    try {
      var _this2 = this;

      console.log("Reading from storage");
      return Promise.resolve(_this2.persistence.reloadNecessary(_this2.lastSync)).then(function (_this$persistence$rel) {
        function _temp3() {
          return _this2.currentCache;
        }

        var _temp2 = function () {
          if (_this$persistence$rel || _this2.currentCache == null) {
            var _temp4 = _finallyRethrows(function () {
              console.log("Reload necessary.  Last sync time: " + _this2.lastSync);
              _this2.crossPlatformLock = new CrossPlatformLock(_this2.lockFilePath, _this2.lockOptions);
              return Promise.resolve(_this2.crossPlatformLock.lock()).then(function () {
                return Promise.resolve(_this2.persistence.load()).then(function (_this$persistence$loa) {
                  _this2.currentCache = _this$persistence$loa;
                  _this2.lastSync = new Date().getTime();
                  console.log("Last sync time updated to: ", _this2.lastSync);
                });
              });
            }, function (_wasThrown, _result) {
              return Promise.resolve(_this2.crossPlatformLock.unlock()).then(function () {
                delete _this2.crossPlatformLock;
                console.log("Pid " + process.pid + " Released lock");
                if (_wasThrown) throw _result;
                return _result;
              });
            });

            if (_temp4 && _temp4.then) return _temp4.then(function () {});
          }
        }();

        return _temp2 && _temp2.then ? _temp2.then(_temp3) : _temp3(_temp2);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.writeToStorage = function writeToStorage(callback) {
    try {
      var _this4 = this;

      var _temp8 = _finallyRethrows(function () {
        console.log("Writing to storage");
        _this4.crossPlatformLock = new CrossPlatformLock(_this4.lockFilePath, _this4.lockOptions);
        return Promise.resolve(_this4.crossPlatformLock.lock()).then(function () {
          return Promise.resolve(_this4.persistence.reloadNecessary(_this4.lastSync)).then(function (_this3$persistence$re) {
            function _temp6() {
              return Promise.resolve(callback(_this4.currentCache)).then(function (_callback) {
                _this4.currentCache = _callback;
                return Promise.resolve(_this4.persistence.save(_this4.currentCache)).then(function () {});
              });
            }

            var _temp5 = function () {
              if (_this3$persistence$re) {
                console.log("Reload necessary.  Last sync time: " + _this4.lastSync);
                return Promise.resolve(_this4.persistence.load()).then(function (_this3$persistence$lo) {
                  _this4.currentCache = _this3$persistence$lo;
                  _this4.lastSync = new Date().getTime();
                  console.log("Last sync time updated to: ", _this4.lastSync);
                });
              }
            }();

            return _temp5 && _temp5.then ? _temp5.then(_temp6) : _temp6(_temp5);
          });
        });
      }, function (_wasThrown2, _result2) {
        return Promise.resolve(_this4.crossPlatformLock.unlock()).then(function () {
          console.log("Pid " + process.pid + " Released lock");
          if (_wasThrown2) throw _result2;
          return _result2;
        });
      });

      return Promise.resolve(_temp8 && _temp8.then ? _temp8.then(function () {}) : void 0);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return PersistenceCachePlugin;
}();

var FilePersistence = /*#__PURE__*/function () {
  function FilePersistence() {}

  FilePersistence.create = function create(fileLocation) {
    try {
      var filePersistence = new FilePersistence();
      filePersistence.filePath = fileLocation;
      return Promise.resolve(filePersistence.createCacheFile()).then(function () {
        return filePersistence;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  var _proto = FilePersistence.prototype;

  _proto.save = function save(contents) {
    try {
      var _this2 = this;

      var writeFilePromise = util.promisify(fs.writeFile);
      return Promise.resolve(_catch(function () {
        return Promise.resolve(writeFilePromise(_this2.getFilePath(), contents, "utf-8")).then(function () {});
      }, function (err) {
        throw PersistenceError.createFileSystemError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.saveBuffer = function saveBuffer(contents) {
    try {
      var _this4 = this;

      var writeFilePromise = util.promisify(fs.writeFile);
      return Promise.resolve(_catch(function () {
        return Promise.resolve(writeFilePromise(_this4.getFilePath(), contents)).then(function () {});
      }, function (err) {
        throw PersistenceError.createFileSystemError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.load = function load() {
    try {
      var _this6 = this;

      var readFilePromise = util.promisify(fs.readFile);
      return Promise.resolve(_catch(function () {
        return Promise.resolve(readFilePromise(_this6.getFilePath(), "utf-8"));
      }, function (err) {
        throw PersistenceError.createFileSystemError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.loadBuffer = function loadBuffer() {
    try {
      var _this8 = this;

      var readFilePromise = util.promisify(fs.readFile);
      return Promise.resolve(_catch(function () {
        return Promise.resolve(readFilePromise(_this8.getFilePath()));
      }, function (err) {
        throw PersistenceError.createFileSystemError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto["delete"] = function _delete() {
    try {
      var _this10 = this;

      var deleteFilePromise = util.promisify(fs.unlink);
      return Promise.resolve(_catch(function () {
        return Promise.resolve(deleteFilePromise(_this10.getFilePath())).then(function () {
          return true;
        });
      }, function (err) {
        if (err.code == Constants.ENOENT_ERROR) {
          // file does not exist, so it was not deleted
          return false;
        }

        throw PersistenceError.createFileSystemError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.getFilePath = function getFilePath() {
    return this.filePath;
  };

  _proto.reloadNecessary = function reloadNecessary(lastSync) {
    try {
      var _this12 = this;

      return Promise.resolve(_this12.timeLastModified()).then(function (_this11$timeLastModif) {
        return lastSync < _this11$timeLastModif;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.timeLastModified = function timeLastModified() {
    try {
      var _this14 = this;

      return Promise.resolve(_catch(function () {
        var statPromise = util.promisify(fs.stat);
        return Promise.resolve(statPromise(_this14.filePath)).then(function (stats) {
          return stats.mtime.getTime();
        });
      }, function (err) {
        if (err.code == Constants.ENOENT_ERROR) {
          // file does not exist, so it's never been modified
          return 0;
        }

        throw PersistenceError.createFileSystemError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.createCacheFile = function createCacheFile() {
    try {
      var _this16 = this;

      return Promise.resolve(_this16.createFileDirectory()).then(function () {
        // File is created only if it does not exist
        var closePromise = util.promisify(fs.close);
        var openPromise = util.promisify(fs.open);
        return Promise.resolve(openPromise(_this16.filePath, "a")).then(function (_openPromise) {
          return Promise.resolve(closePromise(_openPromise)).then(function () {});
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.createFileDirectory = function createFileDirectory() {
    try {
      var _this18 = this;

      return Promise.resolve(_catch(function () {
        var mkdirPromise = util.promisify(fs.mkdir);
        return Promise.resolve(mkdirPromise(path.dirname(_this18.filePath), {
          recursive: true
        })).then(function () {});
      }, function (err) {
        if (err.code == Constants.EEXIST_ERROR) {
          console.log("Directory " + path.dirname(_this18.filePath) + " \" already exists\"");
        } else {
          throw PersistenceError.createFileSystemError(err.code, err.message);
        }
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return FilePersistence;
}();

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var Dpapi = /*#__PURE__*/require("bindings")("dpapi");

var FilePersistenceWithDataProtection = /*#__PURE__*/function () {
  function FilePersistenceWithDataProtection(scope, optionalEntropy) {
    this.scope = scope;
    this.optionalEntropy = optionalEntropy ? Buffer.from(optionalEntropy, "utf-8") : null;
  }

  FilePersistenceWithDataProtection.create = function create(fileLocation, scope, optionalEntropy) {
    try {
      var persistence = new FilePersistenceWithDataProtection(scope, optionalEntropy);
      return Promise.resolve(FilePersistence.create(fileLocation)).then(function (_FilePersistence$crea) {
        persistence.filePersistence = _FilePersistence$crea;
        return persistence;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  var _proto = FilePersistenceWithDataProtection.prototype;

  _proto.save = function save(contents) {
    try {
      var _this2 = this;

      return Promise.resolve(_catch(function () {
        var encryptedContents = Dpapi.protectData(Buffer.from(contents, "utf-8"), _this2.optionalEntropy, _this2.scope.toString());
        return Promise.resolve(_this2.filePersistence.saveBuffer(encryptedContents)).then(function () {});
      }, function (err) {
        throw PersistenceError.createFilePersistenceWithDPAPIError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.load = function load() {
    try {
      var _this4 = this;

      return Promise.resolve(_catch(function () {
        return Promise.resolve(_this4.filePersistence.loadBuffer()).then(function (encryptedContents) {
          return typeof encryptedContents === "undefined" || !encryptedContents || 0 === encryptedContents.length ? null : Dpapi.unprotectData(encryptedContents, _this4.optionalEntropy, _this4.scope.toString()).toString();
        }); // TODO use MSAL common util instead
      }, function (err) {
        throw PersistenceError.createFilePersistenceWithDPAPIError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto["delete"] = function _delete() {
    try {
      var _this6 = this;

      return Promise.resolve(_this6.filePersistence["delete"]());
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.reloadNecessary = function reloadNecessary(lastSync) {
    try {
      var _this8 = this;

      return Promise.resolve(_this8.filePersistence.reloadNecessary(lastSync));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.getFilePath = function getFilePath() {
    return this.filePersistence.getFilePath();
  };

  return FilePersistenceWithDataProtection;
}();

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

(function (DataProtectionScope) {
  DataProtectionScope["CurrentUser"] = "CurrentUser";
  DataProtectionScope["LocalMachine"] = "LocalMachine";
})(exports.DataProtectionScope || (exports.DataProtectionScope = {}));

var KeychainPersistence = /*#__PURE__*/function () {
  function KeychainPersistence(serviceName, accountName) {
    this.serviceName = serviceName;
    this.accountName = accountName;
  }

  KeychainPersistence.create = function create(fileLocation, serviceName, accountName) {
    try {
      var persistence = new KeychainPersistence(serviceName, accountName);
      return Promise.resolve(FilePersistence.create(fileLocation)).then(function (_FilePersistence$crea) {
        persistence.filePersistence = _FilePersistence$crea;
        return persistence;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  var _proto = KeychainPersistence.prototype;

  _proto.save = function save(contents) {
    try {
      var _temp3 = function _temp3(_result) {
        return _exit2 ? _result : Promise.resolve(_this2.filePersistence.save("{}")).then(function () {});
      };

      var _exit2 = false;

      var _this2 = this;

      var _temp4 = _catch(function () {
        return Promise.resolve(keytar.setPassword(_this2.serviceName, _this2.accountName, contents)).then(function () {});
      }, function (err) {
        throw PersistenceError.createKeychainPersistenceError(err.code, err.message);
      });

      return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(_temp3) : _temp3(_temp4)); // Write dummy data to update file mtime
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.load = function load() {
    try {
      var _this4 = this;

      return Promise.resolve(_catch(function () {
        return Promise.resolve(keytar.getPassword(_this4.serviceName, _this4.accountName));
      }, function (err) {
        throw PersistenceError.createKeychainPersistenceError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto["delete"] = function _delete() {
    try {
      var _this6 = this;

      return Promise.resolve(_catch(function () {
        return Promise.resolve(keytar.deletePassword(_this6.serviceName, _this6.accountName));
      }, function (err) {
        throw PersistenceError.createKeychainPersistenceError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.reloadNecessary = function reloadNecessary(lastSync) {
    try {
      var _this8 = this;

      return Promise.resolve(_this8.filePersistence.reloadNecessary(lastSync));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.getFilePath = function getFilePath() {
    return this.filePersistence.getFilePath();
  };

  return KeychainPersistence;
}();

var LibSecretPersistence = /*#__PURE__*/function () {
  function LibSecretPersistence(serviceName, accountName) {
    this.serviceName = serviceName;
    this.accountName = accountName;
  }

  LibSecretPersistence.create = function create(fileLocation, serviceName, accountName) {
    try {
      var persistence = new LibSecretPersistence(serviceName, accountName);
      return Promise.resolve(FilePersistence.create(fileLocation)).then(function (_FilePersistence$crea) {
        persistence.filePersistence = _FilePersistence$crea;
        return persistence;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  var _proto = LibSecretPersistence.prototype;

  _proto.save = function save(contents) {
    try {
      var _temp3 = function _temp3(_result) {
        return _exit2 ? _result : Promise.resolve(_this2.filePersistence.save("{}")).then(function () {});
      };

      var _exit2 = false;

      var _this2 = this;

      var _temp4 = _catch(function () {
        return Promise.resolve(keytar.setPassword(_this2.serviceName, _this2.accountName, contents)).then(function () {});
      }, function (err) {
        throw PersistenceError.createLibSecretError(err.code, err.message);
      });

      return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(_temp3) : _temp3(_temp4)); // Write dummy data to update file mtime
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.load = function load() {
    try {
      var _this4 = this;

      return Promise.resolve(_catch(function () {
        return Promise.resolve(keytar.getPassword(_this4.serviceName, _this4.accountName));
      }, function (err) {
        throw PersistenceError.createLibSecretError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto["delete"] = function _delete() {
    try {
      var _this6 = this;

      return Promise.resolve(_catch(function () {
        return Promise.resolve(keytar.deletePassword(_this6.serviceName, _this6.accountName));
      }, function (err) {
        throw PersistenceError.createLibSecretError(err.code, err.message);
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.reloadNecessary = function reloadNecessary(lastSync) {
    try {
      var _this8 = this;

      return Promise.resolve(_this8.filePersistence.reloadNecessary(lastSync));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  _proto.getFilePath = function getFilePath() {
    return this.filePersistence.getFilePath();
  };

  return LibSecretPersistence;
}();

exports.FilePersistence = FilePersistence;
exports.FilePersistenceWithDataProtection = FilePersistenceWithDataProtection;
exports.KeychainPersistence = KeychainPersistence;
exports.LibSecretPersistence = LibSecretPersistence;
exports.PersistenceCachePlugin = PersistenceCachePlugin;
//# sourceMappingURL=msal-node-extensions.cjs.development.js.map
