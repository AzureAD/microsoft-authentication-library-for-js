const path = require("path");
const fs = require("fs");

const pemPath = process.argv[2];
const pemCert = fs.readFileSync(pemPath, "utf8");


const [privateKey, certs] = pemCert.split("-----END PRIVATE KEY-----");
const x5cCerts = certs.split("-----END CERTIFICATE-----");
x5cCerts.pop();
x5cCerts.unshift(x5cCerts.pop());

const joinedCerts = x5cCerts.join("-----END CERTIFICATE-----");

const orderedPem = `${privateKey}-----END PRIVATE KEY-----${joinedCerts}-----END CERTIFICATE-----`;
fs.writeFileSync(pemPath, orderedPem, "utf8");