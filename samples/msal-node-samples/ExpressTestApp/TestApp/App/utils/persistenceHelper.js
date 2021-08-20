/**
* Simple persistence client helper, using Redis (node-redis).
* You must have redis installed on your machine and redis server listening.
* For demo purposes, the client does not set sliding expiration, see the docs:
* https://redis.io/commands/setex
*/

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