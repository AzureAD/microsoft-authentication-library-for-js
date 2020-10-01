const jose = require("jose");
// Copy Pop token here
const popToken = "";
// Copy jwk here
const jwk = {};
const jwkAsKey = jose.JWK.asKey(jwk);
console.log(jwkAsKey.thumbprint);

const verified = jose.JWT.verify(popToken, jwkAsKey);
console.log(verified);
