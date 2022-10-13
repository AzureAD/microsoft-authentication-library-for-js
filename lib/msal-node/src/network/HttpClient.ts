/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse
} from "@azure/msal-common";
import { HttpMethod, Constants } from "../utils/Constants";
import http from "http";
import https from "https";

/**
 * This class implements the API for network requests.
 */
export class HttpClient implements INetworkModule {

    /**
     * Http Get request
     * @param url
     * @param options
     */
    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
    ): Promise<NetworkResponse<T>> {
        if (options?.proxyUrl) {
            return networkRequestViaProxy(url, HttpMethod.GET, options);
        } else {
            return networkRequestViaHttps(url, HttpMethod.GET, options);
        }
    }

    /**
     * Http Post request
     * @param url
     * @param options
     */
    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
        cancellationToken?: number,
    ): Promise<NetworkResponse<T>> {
        if (options?.proxyUrl) {
            return networkRequestViaProxy(url, HttpMethod.POST, options, cancellationToken);
        } else {
            return networkRequestViaHttps(url, HttpMethod.POST, options, cancellationToken);
        }
    }
}

const networkRequestViaProxy = <T>(
    url: string,
    httpMethod: string,
    options: NetworkRequestOptions,
    timeout?: number,
): Promise<NetworkResponse<T>> => {
    const headers = options?.headers || {} as Record<string, string>;
    const proxyUrl = new URL(options?.proxyUrl || "");
    const destinationUrl = new URL(url);

    // "method: connect" must be used to establish a connection to the proxy
    const tunnelRequestOptions: https.RequestOptions = {
        host: proxyUrl.hostname,
        port: proxyUrl.port,
        method: "CONNECT",
        path: destinationUrl.hostname,
        headers: headers,
    };

    if (timeout) {
        tunnelRequestOptions.timeout = timeout;
    }

    // compose a request string for the socket
    let postRequestStringContent: string = "";
    if (httpMethod === HttpMethod.POST) {
        const body = options?.body || "";
        postRequestStringContent =
            "Content-Type: application/x-www-form-urlencoded\r\n" +
            `Content-Length: ${body.length}\r\n` +
            `\r\n${body}`;
    }
    const outgoingRequestString = `${httpMethod.toUpperCase()} ${destinationUrl.href} HTTP/1.1\r\n` +
        `Host: ${destinationUrl.host}\r\n` +
        "Connection: close\r\n" +
        postRequestStringContent +
        "\r\n";

    return new Promise<NetworkResponse<T>>(((resolve, reject) => {
        const request = http.request(tunnelRequestOptions);

        if (tunnelRequestOptions.timeout) {
            request.on("timeout", () => {
                request.destroy();
                reject(new Error("Request time out"));
            });
        }

        request.end();

        // establish connection to the proxy
        request.on("connect", (response, socket) => {
            const statusCode = response?.statusCode || 500;
            if (statusCode < 200 || statusCode > 299) {
                request.destroy();
                socket.destroy();
                reject(new Error(` Error connecting to proxy: ${response.statusCode}, ${response?.statusMessage}`));
            }
            if (tunnelRequestOptions.timeout) {
                socket.setTimeout(tunnelRequestOptions.timeout);
                socket.on("timeout", () => {
                    request.destroy();
                    socket.destroy();
                    reject(new Error("Request time out"));
                });
            }

            // make a request over an HTTP tunnel
            socket.write(outgoingRequestString);

            const data: Buffer[] = [];
            socket.on("data", (chunk) => {
                data.push(chunk);
            });

            socket.on("end", () => {
                // combine all received buffer streams into one buffer, and then into a string
                const dataString = Buffer.concat([...data]).toString();

                // separate each line into it's own entry in an arry
                const dataStringArray = dataString.split("\r\n");
                // the first entry will contain the statusCode
                const statusCode = parseInt(dataStringArray[0].split(" ")[1]);
                // the last entry will contain the body
                const body = dataStringArray[dataStringArray.length - 1];

                // everything in between the first and last entries are the headers
                const headersArray = dataStringArray.slice(1, dataStringArray.length - 2);

                // build an object out of all the headers
                const entries = new Map();
                headersArray.forEach((header) => {
                    /**
                     * the header might look like "Content-Length: 1531", but that is just a string
                     * it needs to be converted to a key/value pair
                     * split the string at the first instance of ":"
                     * there may be more than one ":" if the value of the header is supposed to be a JSON object
                     */
                    const headerKeyValue = header.split(new RegExp(/:\s(.*)/s));
                    const headerKey = headerKeyValue[0];
                    let headerValue = headerKeyValue[1];

                    // check if the value of the header is supposed to be a JSON object
                    try {
                        const object = JSON.parse(headerValue);

                        // if it is, then convert it from a string to a JSON object
                        if (object && (typeof object === "object")) {
                            headerValue = object;
                        }
                    } catch (e) {
                        // otherwise, leave it as a string
                    }

                    entries.set(headerKey, headerValue);
                });
                const headers = Object.fromEntries(entries);

                const networkResponse: NetworkResponse<T> = {
                    headers: headers as Record<string, string>,
                    body: JSON.parse(body) as T,
                    status: statusCode as number,
                };
                if ((statusCode < 200 || statusCode > 299) &&
                    // do not destroy the request for the device code flow
                    networkResponse.body["error"] !== Constants.AUTHORIZATION_PENDING) {
                    request.destroy();
                }
                resolve(networkResponse);
            });

            socket.on("error", (chunk) => {
                request.destroy();
                socket.destroy();
                reject(new Error(chunk.toString()));
            });
        });

        request.on("error", (chunk) => {
            request.destroy();
            reject(new Error(chunk.toString()));
        });
    }));
};

const networkRequestViaHttps = <T>(
    url: string,
    httpMethod: string,
    options?: NetworkRequestOptions,
    timeout?: number,
): Promise<NetworkResponse<T>> => {
    const isPostRequest = httpMethod === HttpMethod.POST;
    const body: string = options?.body || "";

    const emptyHeaders: Record<string, string> = {};
    const customOptions: https.RequestOptions = {
        method: httpMethod,
        headers: options?.headers || emptyHeaders,
    };

    if (timeout) {
        customOptions.timeout = timeout;
    }

    if (isPostRequest) {
        // needed for post request to work
        customOptions.headers = {
            ...customOptions.headers,
            "Content-Length": body.length,
        };
    }

    return new Promise<NetworkResponse<T>>((resolve, reject) => {
        const request = https.request(url, customOptions);

        if (timeout) {
            request.on("timeout", () => {
                request.destroy();
                reject(new Error("Request time out"));
            });
        }

        if (isPostRequest) {
            request.write(body);
        }

        request.end();

        request.on("response", (response) => {
            const headers = response.headers;
            const statusCode = response.statusCode as number;

            const data: Buffer[] = [];
            response.on("data", (chunk) => {
                data.push(chunk);
            });

            response.on("end", () => {
                // combine all received buffer streams into one buffer, and then into a string
                const body = Buffer.concat([...data]).toString();

                const networkResponse: NetworkResponse<T> = {
                    headers: headers as Record<string, string>,
                    body: JSON.parse(body) as T,
                    status: statusCode,
                };

                if ((statusCode < 200 || statusCode > 299) &&
                    // do not destroy the request for the device code flow
                    networkResponse.body["error"] !== Constants.AUTHORIZATION_PENDING) {
                    request.destroy();
                }
                resolve(networkResponse);
            });
        });

        request.on("error", (chunk) => {
            request.destroy();
            reject(new Error(chunk.toString()));
        });
    });
};

