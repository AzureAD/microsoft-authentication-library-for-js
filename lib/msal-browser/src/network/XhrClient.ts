/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule, NetworkRequestOptions } from "msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { HTTP_REQUEST_TYPE } from "../utils/BrowserConstants";

export class XhrClient implements INetworkModule {

    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {
        return this.sendRequestAsync(url, HTTP_REQUEST_TYPE.GET, options);
    }    
    
    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {
        return this.sendRequestAsync(url, HTTP_REQUEST_TYPE.POST, options);
    }

    private sendRequestAsync<T>(url: string, method: string, options?: NetworkRequestOptions): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, /* async: */ true);
            this.setXhrHeaders(xhr, options.headers);
            xhr.onload = (ev) => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(this.handleError(xhr.responseText));
                }
                try {
                    let jsonResponse = JSON.parse(xhr.responseText) as T;
                    resolve(jsonResponse);
                } catch (e) {
                    reject(this.handleError(xhr.responseText));
                }
            };

            xhr.onerror = (ev) => {
                reject(xhr.status);
            };

            if (method === "POST" && options.body) {
                xhr.send(options.body);
            } else if (method === "GET") {
                xhr.send();
            } else {
                throw BrowserAuthError.createHttpMethodNotImplementedError(method);
            }
        });
    }

    private handleError(responseText: string): any {
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

    private setXhrHeaders(xhr: XMLHttpRequest, headers: Map<string, string>): void {
        for (const headerName in headers.keys()) {
            xhr.setRequestHeader(headerName, headers.get(headerName));
        }
    }
}
