/**
* Simple persistence client helper, using Redis (node-redis).
* You must have redis installed on your machine and have redis server listening.
* Note that this is only for illustration, and you'll likely need to consider cache eviction policies and handle cache server connection issues. 
* For more information, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
*/

module.exports = (client) => {
    return {
        get: (key, callback) => {
            client.get(key, callback);
        },
        // For demo purposes, the client does not set sliding expiration, see the docs https://redis.io/commands/setex
        set: (key, value, callback) => {
            client.set(key, value, callback);
        },
    }
};