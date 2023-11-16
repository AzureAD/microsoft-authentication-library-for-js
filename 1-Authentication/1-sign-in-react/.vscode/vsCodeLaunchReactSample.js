const {exec} = require('child_process');
const path = require("path");
exec('npm install && npm start',{cwd:path.resolve('.\\SPA')}, (err, output) => {
    // once the command has completed, the callback function is called
    if (err) {
        // log and return if we encounter an error
        console.error("Error on running commands: ", err)
        return
    }
    // log the output received from the command
    console.log("Output: \n", output)
}) 