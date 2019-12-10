/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule, NetworkRequestOptions } from "msal-common";

export class XhrClient implements INetworkModule {

    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {
        return this.sendRequestAsync(url, "GET", options);
    }    
    
    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {
        return this.sendRequestAsync(url, "POST", options);
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
                let jsonResponse: T;
                try {
                    jsonResponse = JSON.parse(xhr.responseText) as T;
                } catch (e) {
                    reject(this.handleError(xhr.responseText));
                }

                resolve(jsonResponse);
            };

            xhr.onerror = (ev) => {
                reject(xhr.status);
            };

            if (method === "GET" || method === "POST") {
                reqBody ? xhr.send(reqBody) : xhr.send();
            }
            else {
                throw "not implemented";
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
