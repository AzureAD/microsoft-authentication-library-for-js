#!/usr/bin/env node

// read in env settings

require('dotenv').config();

const yargs = require('yargs');
const fetch = require('./fetch');
const auth = require('./auth');

const options = yargs
    .usage('Usage: --op <operation_name>')
    .option('op', { alias: 'operation', describe: 'operation name', type: 'string', demandOption: true })
    .argv;

async function main() {
    console.log(`You have selected: ${options.op}`);

    switch (yargs.argv['op']) {
        case 'getToDos':

            try {
                const authResponse = await auth.getToken(auth.tokenRequest);
                const todos = await fetch.callApi(auth.apiConfig.uri, authResponse.accessToken);
                
                console.log(todos);
            } catch (error) {
                console.log(error);
            }

            break;
        default:
            console.log('Select an operation first');
            break;
    }
};

main();