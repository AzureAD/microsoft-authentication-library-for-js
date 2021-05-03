require("@babel/register")({ extensions: [".js", ".jsx", ".ts", ".tsx"] });
require("@azure/msal-common");
require("jsdom-global")("", {
    url: "https://localhost:8081/index.html"
});
window.crypto = require("./polyfills/msrcrypto.min");
