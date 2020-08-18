const cachePlugin = require("./cachePlugin");

const authority = {
    ADFSAuthority: "",
}

module.exports = {
    /**
     * Public Client Application Configuration
     */
    auth: {
        clientId: "",
        authority: authority.ADFSAuthority,
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cachePlugin,
    },
};
