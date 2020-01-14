/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Common package imports
import { INetworkModule, NetworkRequestOptions } from "msal-common";
// Error
import { BrowserAuthError } from "../error/BrowserAuthError";
// HTTP Constants
import { HTTP_REQUEST_TYPE } from "../utils/BrowserConstants";

/**
 * This client implements the XMLHttpRequest class to send GET and POST requests.
 */
export class XhrClient implements INetworkModule {

    /**
     * XhrClient for REST endpoints - Get request
     * @param url 
     * @param headers 
     * @param body 
     */
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
            this.setXhrHeaders(xhr, options);
            xhr.onload = (): void => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(xhr.responseText);
                }
                try {
                    const jsonResponse = JSON.parse(xhr.responseText) as T;
                    resolve(jsonResponse);
                } catch (e) {
                    reject(xhr.responseText);
                }
            };

            xhr.onerror = (): void => {
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

    private setXhrHeaders(xhr: XMLHttpRequest, options?: NetworkRequestOptions): void {
        if (options && options.headers) {
            options.headers.forEach((value, key) => {
                xhr.setRequestHeader(key, value);
            });
        }
    }
}
