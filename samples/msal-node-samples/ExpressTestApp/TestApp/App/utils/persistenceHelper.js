module.exports = (client) => {
    return {
        get: (key, callback) => {
            client.get(key, callback);
        },
        set: (key, value, callback) => {
            client.set(key, value, callback);
        },
        delete: (key, callback) => {
            client.del(key, callback);
        },
        exists: (key, callback) => {
            client.exists(key, callback);
        }
    }
};