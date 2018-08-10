/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
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
