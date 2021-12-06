/**
* Simple persistence client helper, using Redis (node-redis).
* You must have redis installed on your machine and have redis server listening.
* Note that this is only for illustration, and you'll likely need to consider cache eviction policies and handle cache server connection issues. 
* For more information, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
*/

module.exports = (client) => {
    return {
        get: (key) => {
            return new Promise((resolve, reject) => {
                client.get(key, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                        
                    return resolve(data);
                });
            });
        },
        set: (key, value) => {
            return new Promise((resolve, reject) => {
                client.set(key, value, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
        
                    return resolve(data);
                });
            });
        },
    }
};