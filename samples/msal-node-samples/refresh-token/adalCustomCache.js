var fs = require('fs');
var _ = require('underscore');

/**
 * Constructs a new token cache on disk.
 * This effectively implements the ADAL TokenCache interface.
 * @constructor
 */
function DiskCache(cacheLocation) {
    this._cacheLocation = cacheLocation;
    this._entries = [];
}

/**
 * Removes a collection of entries from the cache in a single batch operation.
 * @param {Array} entries An array of cache entries to remove.
 * @param {Function} callback This function is called when the operation is complete. Any error is provided as the first parameter.
 */
DiskCache.prototype.remove = function (entries, callback) {
    var cachedEntries = _readCache.call(this);

    var updatedEntries = _.filter(cachedEntries, function (element) {
        if (_.findWhere(entries, element)) {
            return false;
        }
        return true;
    });

    _writeCache.call(this, updatedEntries);
    callback();
};

/**
 * Adds a collection of entries to the cache in a single batch operation.
 * @param {Array} entries  An array of entries to add to the cache.
 * @param {Function} callback This function is called when the operation is complete. Any error is provided as the first parameter.
 */
DiskCache.prototype.add = function (entries, callback) {
    var cachedEntries = _readCache.call(this);

    // Remove any entries that are duplicates of the existing
    // cache elements.
    _.each(cachedEntries, function (element) {
        _.each(entries, function (addElement, index) {
            if (entriesHaveEqualHashKeys(element, addElement)) {
                entries[index] = null;
            }
        });
    });

    // Add the new entries to the end of the cache.
    var newEntries = _.compact(entries);

    for (var i = 0; i < newEntries.length; i++) {
        cachedEntries.push(newEntries[i]);
    }

    _writeCache.call(this, cachedEntries);
    callback(null, true);
};

/**
 * Finds all entries in the cache that match all of the passed in values.
 * @param {object} query This object will be compared to each entry in the cache.
 * Any entries that match all of the values in this object will be returned. All the values
 * in the passed in object must match values in a potentially returned object
 * exactly. The returned object may have more values than the passed in query object.
 * @param {Function} callback
 */
DiskCache.prototype.find = function (query, callback) {
    var cachedEntries = _readCache.call(this);
    var results = _.where(cachedEntries, query);
    callback(null, results);
};

function _readCache() {
    if (fs.existsSync(this._cacheLocation)) {
        var data = fs.readFileSync(this._cacheLocation);
        this._entries = JSON.parse(data);
    } else {
        fs.writeFile(this._cacheLocation, JSON.stringify(this._entries), (error) => {
            if (error) {
                throw error;
            }
        });
    }

    return this._entries;
}

function _writeCache(data) {
    fs.writeFile(this._cacheLocation, JSON.stringify(data), (error) => {
        if (error) {
            throw error;
        }
    });
}

function entriesHaveEqualHashKeys(a, b) {
    return _.isEqual(extractCacheKeyFromEntry(a), extractCacheKeyFromEntry(b));
}

function extractCacheKeyFromEntry(entry) {
    if (!entry) return null;

    return {
        _clientId: entry._clientId,
        _authority: entry._authority,
        userId: entry.userId,
        resource: entry.resource
    };
}

module.exports = DiskCache
