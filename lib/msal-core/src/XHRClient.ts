// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * XHR client for JSON endpoints
 * https://www.npmjs.com/package/async-promise
 * @hidden
 */
export class XhrClient {
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
