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
};

async function metadataWatch() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const arguments = require("yargs")
        .scriptName("metadata:check")
        .usage("$0 <cmd> [args]")
        .option("f", {
            alias: "fix",
            demandOption: false,
            type: "boolean"
        })
        .help()
        .argv;

    const shouldFix = !!arguments.f;

    // eslint-disable-next-line no-console
    console.log("ℹ️  Checking all the authorities for validity of their saved metadata");

    if (shouldFix) {
        // eslint-disable-next-line no-console
        console.log("🔧 Fixing any mismatches that are going to be found");
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
            // eslint-disable-next-line no-console
            console.log(`❌ Endpoint metadata for authority => ${authority} is invalid`);
            failedChecks = true;

            if (shouldFix) {
                // eslint-disable-next-line no-console
                console.log(`🔧 Updating endpoint metadata for the authority => ${authority} ....`);
                metadataJson.endpointMetadata[authority] = newEndpointMetadata;
                // eslint-disable-next-line no-console
                console.log("✅ Update complete.");
            }
        } else {
            // eslint-disable-next-line no-console
            console.log(`✔️ Endpoint metadata for authority => ${authority} is valid`);
        }

        // Check for instance discovery metadata
        const [instanceDiscoveryMetadataIsValid, newInstanceDiscoveryMetadata] = await checkValidityOfMetadata(metadataJson.instanceDiscoveryMetadata[authority], METADATA_SOURCES.instanceDiscoveryMetadata.replace(AUTHORITY_PLACHOLDER, authority));

        if (!instanceDiscoveryMetadataIsValid) {
            // eslint-disable-next-line no-console
            console.log(`❌ Instance discovery metadata for authority => ${authority} is invalid`);

            if (shouldFix) {
                // eslint-disable-next-line no-console
                console.log(`🔧 Updating Instance discovery metadata for the authority => ${authority} ....`);
                metadataJson.instanceDiscoveryMetadata[authority] = newInstanceDiscoveryMetadata;
                // eslint-disable-next-line no-console
                console.log("✅ Update complete.");
            }
        } else {
            // eslint-disable-next-line no-console
            console.log(`✔️ Instance discovery metadata for authority => ${authority} is valid`);
        }
    }));

    if (shouldFix) {
        updateMetadataInformation(metadataJson);
    }

    return process.exit(failedChecks && !shouldFix ? 1 : 0);
}

async function checkValidityOfMetadata(originalMetadata, url) {
    const response = await axios.get(url, { timeout: 5000 });
    const newMetadata = response.data;

    return [isEqual(originalMetadata, newMetadata), newMetadata];
}

function updateMetadataInformation(metadata) {
    fs.writeFileSync(METADATA_JSON_LOCATION, JSON.stringify(metadata));
}

metadataWatch();
