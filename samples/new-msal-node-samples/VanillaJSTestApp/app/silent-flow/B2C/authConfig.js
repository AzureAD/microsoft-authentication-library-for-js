const policies = require("./policies");
const { promises: fs } = require("fs");

module.exports = {
    /**
     * Public Client Application Configuration
     */
    auth: {
        clientId: "57eeeaa5-2ff7-497e-84bb-b45fe138ad58",
        authority: policies.b2cPolicies.authorities.signUpSignIn.authority,
        knownAuthorities: ["SAMEERAB2C.b2clogin.com"],
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cachePlugin,
    },
};
