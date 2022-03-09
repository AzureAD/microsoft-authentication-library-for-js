/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const axios = require("axios");
const { isEqual } = require("lodash");
const fs = require("fs");

const METADATA_JSON_LOCATION = "src/utils/metadata.json";
const AUTHORITY_PLACHOLDER = "{AUTHORITY}";
const METADATA_SOURCES = {
    endpointMetadata: `${AUTHORITY_PLACHOLDER}v2.0/.well-known/openid-configuration`,
    instanceDiscoveryMetadata: `https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=${AUTHORITY_PLACHOLDER}oauth2/v2.0/authorize`
}

async function metadataWatch() {
    const arguments = require('yargs')
        .scriptName("metadata:check")
        .usage('$0 <cmd> [args]')
        .option('f', { 
            alias: "fix", 
            demandOption: false, 
            type: "boolean" 
        })
        .help()
        .argv

    const shouldFix = !!arguments.f;

    console.log("ℹ️  Checking all the authorities for validity of their saved metadata");

    if (shouldFix) {
        console.log("🔧 Fixing any mismatches that are going to be found");
    }

    const metadataJson = require(`../../${METADATA_JSON_LOCATION}`);
    let failedChecks = false;

    // Aggregate a list of authorities to perform the checks on.
    const listOfAuthorities = [
        ...Object.keys(metadataJson.endpointMetadata), 
        ...Object.keys(metadataJson.instanceDiscoveryMetadata).filter(auth => !Object.keys(metadataJson.endpointMetadata).includes(auth))
    ];


    await Promise.all(listOfAuthorities.map(async authority => {
        // Check endpoint metadata
        const [endpointMetadataIsValid, newEndpointMetadata] = await checkValidityOfMetadata(metadataJson.endpointMetadata[authority], METADATA_SOURCES.endpointMetadata.replace(AUTHORITY_PLACHOLDER, authority));

        if (!endpointMetadataIsValid) {
            console.log(`❌ Endpoint metadata for authority => ${authority} is invalid`)
            failedChecks = true;

            if (shouldFix) {
                console.log(`🔧 Updating endpoint metadata for the authority => ${authority} ....`);
                metadataJson.endpointMetadata[authority] = newEndpointMetadata;
                console.log("✅ Update complete.");
            }
        } else {
            console.log(`✔️ Endpoint metadata for authority => ${authority} is valid`);
        }

        // Check for instance discovery metadata
        const [instanceDiscoveryMetadataIsValid, newInstanceDiscoveryMetadata] = await checkValidityOfMetadata(metadataJson.instanceDiscoveryMetadata[authority], METADATA_SOURCES.instanceDiscoveryMetadata.replace(AUTHORITY_PLACHOLDER, authority));

        if (!instanceDiscoveryMetadataIsValid) {
            console.log(`❌ Instance discovery metadata for authority => ${authority} is invalid`)

            if (shouldFix) {
                console.log(`🔧 Updating Instance discovery metadata for the authority => ${authority} ....`);
                metadataJson.instanceDiscoveryMetadata[authority] = newInstanceDiscoveryMetadata;
                console.log("✅ Update complete.");
            }
        } else {
            console.log(`✔️ Instance discovery metadata for authority => ${authority} is valid`);
        }
    }))

    if (shouldFix) {
        updateMetadataInformation(metadataJson);
    }

    return process.exit(failedChecks && !shouldFix ? 1 : 0)
}

async function checkValidityOfMetadata(originalMetadata, url) {
    const response = await axios.get(url);
    const newMetadata = response.data;

    return [isEqual(originalMetadata, newMetadata), newMetadata];
}

function updateMetadataInformation(metadata) {
    fs.writeFileSync(METADATA_JSON_LOCATION, JSON.stringify(metadata));
}

metadataWatch();