/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule } from "msal-common";

export class XhrClient implements INetworkModule {

    async sendGetRequestAsync(url: string, headers?: Map<string, string>, body?: string): Promise<any> {
        return this.sendRequestAsync(url, "GET", headers, body);
    }    
    
    async sendPostRequestAsync(url: string, headers?: Map<string, string>, body?: string): Promise<any> {
        return this.sendRequestAsync(url, "POST", headers, body);
    }

    private sendRequestAsync(url: string, method: string, headers?: Map<string, string>, body?: string): Promise<any> {
        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, /* async: */ true);
            this.setXhrHeaders(xhr, headers);
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

            if (method === "GET" || method === "POST") {
                xhr.send(body);
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
