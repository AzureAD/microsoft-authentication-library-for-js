// to ensure that env not in the CI server log

const path = require("path")
const { spawnSync } = require("child_process")

spawnSync(path.join(__dirname, '../node_modules/.bin/prebuild' + (process.platform === "win32" ? '.cmd' : '')), ['--upload-all', process.env.GITHUB_AUTH_TOKEN], {stdio: 'inherit'})
