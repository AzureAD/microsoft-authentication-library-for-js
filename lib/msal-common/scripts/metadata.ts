/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import https from "https";
import yargs from "yargs";
import { isEqual } from "lodash";

const METADATA_TYPESCRIPT_LOCATION = "src/authority/AuthorityMetadata.ts";
const AUTHORITY_PLACHOLDER = "{AUTHORITY}";
const METADATA_SOURCES = {
    endpointMetadata: `${AUTHORITY_PLACHOLDER}v2.0/.well-known/openid-configuration`,
    instanceDiscoveryMetadata: `https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=${AUTHORITY_PLACHOLDER}oauth2/v2.0/authorize`,
};

async function metadataWatch() {
    const command = yargs
        .scriptName("metadata:check")
        .usage("$0 <cmd> [args]")
        .option("f", {
            alias: "fix",
            demandOption: false,
            type: "boolean",
        })
        .help();

    const shouldFix = !!command.argv.f;
    let failedChecks = false;

    // eslint-disable-next-line no-console
    console.log(
        "ℹ️  Checking all the authorities for validity of their saved metadata"
    );

    if (shouldFix) {
        // eslint-disable-next-line no-console
        console.log("🔧 Fixing any mismatches that are going to be found");
    }

    const {
        rawMetdataJSON: metadataJson,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    } = require(`../${METADATA_TYPESCRIPT_LOCATION}`);

    // Aggregate a list of authorities to perform the checks on.
    const listOfAuthorities = [
        ...Object.keys(metadataJson.endpointMetadata),
        ...Object.keys(metadataJson.instanceDiscoveryMetadata).filter(
            (auth) => !Object.keys(metadataJson.endpointMetadata).includes(auth)
        ),
    ];

    try {
        await Promise.all(
            listOfAuthorities.map(async (authority) => {
                // Check endpoint metadata
                const [endpointMetadataIsValid, newEndpointMetadata] =
                    await checkValidityOfMetadata(
                        metadataJson.endpointMetadata[authority],
                        METADATA_SOURCES.endpointMetadata.replace(
                            AUTHORITY_PLACHOLDER,
                            authority
                        )
                    );

                if (!endpointMetadataIsValid) {
                    // eslint-disable-next-line no-console
                    console.log(
                        `❌ Endpoint metadata for authority => ${authority} is invalid`
                    );
                    failedChecks = true;

                    if (shouldFix) {
                        // eslint-disable-next-line no-console
                        console.log(
                            `🔧 Updating endpoint metadata for the authority => ${authority} ....`
                        );
                        metadataJson.endpointMetadata[authority] =
                            newEndpointMetadata;
                        // eslint-disable-next-line no-console
                        console.log("✅ Update complete.");
                    }
                } else {
                    // eslint-disable-next-line no-console
                    console.log(
                        `✔️ Endpoint metadata for authority => ${authority} is valid`
                    );
                }

                // Check for instance discovery metadata
                const [
                    instanceDiscoveryMetadataIsValid,
                    newInstanceDiscoveryMetadata,
                ] = await checkValidityOfMetadata(
                    metadataJson.instanceDiscoveryMetadata[authority],
                    METADATA_SOURCES.instanceDiscoveryMetadata.replace(
                        AUTHORITY_PLACHOLDER,
                        authority
                    )
                );

                if (!instanceDiscoveryMetadataIsValid) {
                    // eslint-disable-next-line no-console
                    console.log(
                        `❌ Instance discovery metadata for authority => ${authority} is invalid`
                    );

                    if (shouldFix) {
                        // eslint-disable-next-line no-console
                        console.log(
                            `🔧 Updating Instance discovery metadata for the authority => ${authority} ....`
                        );
                        metadataJson.instanceDiscoveryMetadata[authority] =
                            newInstanceDiscoveryMetadata;
                        // eslint-disable-next-line no-console
                        console.log("✅ Update complete.");
                    }
                } else {
                    // eslint-disable-next-line no-console
                    console.log(
                        `✔️ Instance discovery metadata for authority => ${authority} is valid`
                    );
                }
            })
        );
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
            "Failed to run the metadata checker successfully with the error: ",
            `For the url ${error.config.url} => ${error.toString()}`
        );
    } finally {
        if (shouldFix) {
            updateMetadataInformation(metadataJson);
        }

        return process.exit(failedChecks && !shouldFix ? 1 : 0);
    }
}

function networkRequestViaHttps (
    url: string,
    options?: { [key: string]: any },
    timeout?: number,
) {
    const customOptions: { [key: string]: any } = {
        method: "GET",
        headers: options?.headers || {},
    };

    if (timeout) {
        customOptions.timeout = timeout;
    }

    return new Promise((resolve, reject) => {
        const request = https.request(url, customOptions);

        if (timeout) {
            request.on("timeout", () => {
                request.destroy();
                reject(new Error("Request time out"));
            });
        }

        request.end();

        request.on("response", (response: any) => {
            const headers = response.headers;
            const statusCode = response.statusCode;

            const data: Buffer[] = [];
            response.on("data", (chunk: any) => {
                data.push(chunk);
            });

            response.on("end", () => {
                // combine all received buffer streams into one buffer, and then into a string
                const body = Buffer.concat([...data]).toString();

                const networkResponse = {
                    headers: headers,
                    body: JSON.parse(body),
                    status: statusCode,
                };

                if ((statusCode < 200 || statusCode > 299)) {
                    request.destroy();
                    reject(new Error(`HTTP status code ${statusCode}`));
                }

                resolve(networkResponse);
            });
        });

        request.on("error", (chunk: any) => {
            request.destroy();
            reject(new Error(chunk.toString()));
        });
    });
}

async function checkValidityOfMetadata(originalMetadata: any, url: string) {
    const response = await networkRequestViaHttps(url, {}, 30000) as any;
    const newMetadata = response.body;

    return [isEqual(originalMetadata, newMetadata), newMetadata];
}

function updateMetadataInformation(metadata: any) {
    fs.writeFileSync(
        METADATA_TYPESCRIPT_LOCATION,
        `/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const rawMetdataJSON = ${JSON.stringify(metadata)};

export const EndpointMetadata = rawMetdataJSON.endpointMetadata;
export const InstanceDiscoveryMetadata = rawMetdataJSON.instanceDiscoveryMetadata;

`
    );
}

metadataWatch();

