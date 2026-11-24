// Use Node's ESM interop because Jest 29 cannot require Puppeteer's ESM entry.
module.exports = process
    .getBuiltinModule("node:module")
    .createRequire(__filename)("puppeteer");
