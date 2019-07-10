// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Provides a simple interface for sending a REST API request
 * and returning the deserialized JSON response as an object.
 */
export interface IXhrClient {
  /**
   * Sends a request asyncrhonously to the specified URL and returns
   * the deserialized JSON response as an object.
   *
   * @param url The Url to which the request will be sent.
   * @param method The HTTP method to use for the request.
   * @param enableCaching If true, enables response caching.
   * @return An object containing the deserialized JSON response.
   */
  sendRequestAsync(url: string, method: string, enableCaching?: boolean): Promise<any>;
}

/**
 * XHR client for JSON endpoints
 * https://www.npmjs.com/package/async-promise
 * @hidden
 */
export class XhrClient implements IXhrClient {
  public sendRequestAsync(url: string, method: string, enableCaching?: boolean): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, /*async: */ true);
      if (enableCaching) {
        // TODO: (shivb) ensure that this can be cached
        // xhr.setRequestHeader("Cache-Control", "Public");
      }

      xhr.onload = (ev) => {
          if (xhr.status < 200 || xhr.status >= 300) {
              reject(this.handleError(xhr.responseText));
          }

          try {
              var jsonResponse = JSON.parse(xhr.responseText);
          } catch (e) {
              reject(this.handleError(xhr.responseText));
          }

          resolve(jsonResponse);
      };

      xhr.onerror = (ev) => {
        reject(xhr.status);
      };

      if (method === "GET") {
        xhr.send();
      }
      else {
        throw "not implemented";
      }
    });
  }

  protected handleError(responseText: string): any {
    var jsonResponse;
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
