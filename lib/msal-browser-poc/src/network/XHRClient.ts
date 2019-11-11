/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IXhrClient } from "./IXHRClient";

/**
 * XHR client for JSON endpoints
 * https://www.npmjs.com/package/async-promise
 * @hidden
 */
export class XhrClient implements IXhrClient {
    public sendRequestAsync(url: string, requestParams: RequestInit, enableCaching?: boolean): Promise<any> {
        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(requestParams.method, url, /* async: */ true);
            xhr.onload = (ev) => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(this.handleError(xhr.responseText));
                }
                let jsonResponse;
                try {
                    jsonResponse = JSON.parse(xhr.responseText);
                } catch (e) {
                    reject(this.handleError(xhr.responseText));
                }

                resolve(jsonResponse);
            };

            xhr.onerror = (ev) => {
                reject(xhr.status);
            };

            if (requestParams.method === "GET") {
                xhr.send();
            }
            else {
                throw "not implemented";
            }
        });
    }

    protected handleError(responseText: string): any {
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(responseText);
            if (jsonResponse.error) {
                return jsonResponse.error;
            } else {
                throw responseText;
            }
        } catch (e) {
            return responseText;
        }
    }
}
