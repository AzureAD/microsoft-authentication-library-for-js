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

import { IUri } from "./IUri";
import { User } from "./User";

/*
 * @hidden
 */
export class Utils {
  static compareObjects(u1: User, u2: User): boolean {
   if (!u1 || !u2) {
          return false;
      }
    if (u1.userIdentifier && u2.userIdentifier) {
      if (u1.userIdentifier === u2.userIdentifier) {
        return true;
      }
    }
    return false;
  }

  static expiresIn(expires: string): number {
    // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
     if (!expires) {
         expires = "3599";
      }
    return this.now() + parseInt(expires, 10);
  }

  static now(): number {
    return Math.round(new Date().getTime() / 1000.0);
  }

  static isEmpty(str: string): boolean {
    return (typeof str === "undefined" || !str || 0 === str.length);
  }

  static extractIdToken(encodedIdToken: string): any {
    // id token will be decoded to get the username
    const decodedToken = this.decodeJwt(encodedIdToken);
    if (!decodedToken) {
      return null;
    }
    try {
      const base64IdToken = decodedToken.JWSPayload;
      const base64Decoded = this.base64DecodeStringUrlSafe(base64IdToken);
      if (!base64Decoded) {
        //this._requestContext.logger.info("The returned id_token could not be base64 url safe decoded.");
        return null;
      }
      // ECMA script has JSON built-in support
      return JSON.parse(base64Decoded);
    } catch (err) {
      //this._requestContext.logger.error("The returned id_token could not be decoded" + err);
    }

    return null;
  }

  static base64EncodeStringUrlSafe(input: string): string {
    // html5 should support atob function for decoding
    if (window.btoa) {
      return window.btoa(input);
    }
    else {
      return this.encode(input);
    }
  }

  static base64DecodeStringUrlSafe(base64IdToken: string): string {
    // html5 should support atob function for decoding
    base64IdToken = base64IdToken.replace(/-/g, "+").replace(/_/g, "/");
    if (window.atob) {
        return decodeURIComponent(encodeURIComponent(window.atob(base64IdToken))); // jshint ignore:line
    }
    else {
        return decodeURIComponent(encodeURIComponent(this.decode(base64IdToken)));
    }
  }

  static encode(input: string): string {
    const keyStr: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let chr1: number, chr2: number, chr3: number, enc1: number, enc2: number, enc3: number, enc4: number;
    var i = 0;

    input = this.utf8Encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }

    return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  static utf8Encode(input: string): string {
    input = input.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < input.length; n++) {
      var c = input.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  }

  static decode(base64IdToken: string): string {
    var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    base64IdToken = String(base64IdToken).replace(/=+$/, "");
    var length = base64IdToken.length;
    if (length % 4 === 1) {
      throw new Error("The token to be decoded is not correctly encoded.");
    }
    let h1: number, h2: number, h3: number, h4: number, bits: number, c1: number, c2: number, c3: number, decoded = "";
    for (var i = 0; i < length; i += 4) {
      //Every 4 base64 encoded character will be converted to 3 byte string, which is 24 bits
      // then 6 bits per base64 encoded character
      h1 = codes.indexOf(base64IdToken.charAt(i));
      h2 = codes.indexOf(base64IdToken.charAt(i + 1));
      h3 = codes.indexOf(base64IdToken.charAt(i + 2));
      h4 = codes.indexOf(base64IdToken.charAt(i + 3));
      // For padding, if last two are "="
      if (i + 2 === length - 1) {
        bits = h1 << 18 | h2 << 12 | h3 << 6;
        c1 = bits >> 16 & 255;
        c2 = bits >> 8 & 255;
        decoded += String.fromCharCode(c1, c2);
        break;
      }
      // if last one is "="
      else if (i + 1 === length - 1) {
        bits = h1 << 18 | h2 << 12;
        c1 = bits >> 16 & 255;
        decoded += String.fromCharCode(c1);
        break;
      }
      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
      // then convert to 3 byte chars
      c1 = bits >> 16 & 255;
      c2 = bits >> 8 & 255;
      c3 = bits & 255;
      decoded += String.fromCharCode(c1, c2, c3);
    }
    return decoded;
  }

  static decodeJwt(jwtToken: string): any {
    if (this.isEmpty(jwtToken)) {
      return null;
    }
    const idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
    const matches = idTokenPartsRegex.exec(jwtToken);
    if (!matches || matches.length < 4) {
      //this._requestContext.logger.warn("The returned id_token is not parseable.");
      return null;
    }
    const crackedToken = {
      header: matches[1],
      JWSPayload: matches[2],
      JWSSig: matches[3]
    };
    return crackedToken;
  }

  static deserialize(query: string): any {
    let match: Array<string>; // Regex for replacing addition symbol with a space
    const pl = /\+/g;
    const search = /([^&=]+)=([^&]*)/g;
    const decode = (s: string) => decodeURIComponent(s.replace(pl, " "));
    const obj: {} = {};
    match = search.exec(query);
    while (match) {
      obj[decode(match[1])] = decode(match[2]);
      match = search.exec(query);
    }
    return obj;
  }

  static isIntersectingScopes(cachedScopes: Array<string>, scopes: Array<string>): boolean {
    cachedScopes = this.convertToLowerCase(cachedScopes);
    for (let i = 0; i < scopes.length; i++) {
        if (cachedScopes.indexOf(scopes[i].toLowerCase()) > -1) {
            return true;
        }
    }
    return false;
  }

  static containsScope(cachedScopes: Array<string>, scopes: Array<string>): boolean {
    cachedScopes = this.convertToLowerCase(cachedScopes);
    return scopes.every((value: any): boolean => cachedScopes.indexOf(value.toString().toLowerCase()) >= 0);
  }

  static convertToLowerCase(scopes: Array<string>): Array<string> {
    return scopes.map(scope => scope.toLowerCase());
  }

  static removeElement(scopes: Array<string>, scope: string): Array<string> {
    return scopes.filter(value => value !== scope);
  }

  static decimalToHex(num: number): string {
    var hex: string = num.toString(16);
    while (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex;
  }

  static getLibraryVersion(): string {
    return "0.2.1";
  }

  /*
    * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
    * @param href The url
    * @param tenantId The tenant id to replace
    */
  static replaceFirstPath(href: string, tenantId: string): string {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#] *)(?:\:([0-9]+))?)([\/]{0,1}[^?#] *)(\?[^#] *|)(#. *|)$/);
    if (match) {
      var urlObject = Utils.GetUrlComponents(href);
      var pathArray = urlObject.PathSegments;
      pathArray.shift();
      if (pathArray[0] && pathArray[0] === "common" || pathArray[0] === "organizations") {
        pathArray[0] = tenantId;
        href = urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + pathArray.join("/");
      }
    }
    return href;
  }

  static createNewGuid(): string {
    // RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
    // pseudo-random numbers.
    // The algorithm is as follows:
    //     Set the two most significant bits (bits 6 and 7) of the
    //        clock_seq_hi_and_reserved to zero and one, respectively.
    //     Set the four most significant bits (bits 12 through 15) of the
    //        time_hi_and_version field to the 4-bit version number from
    //        Section 4.1.3. Version4
    //     Set all the other bits to randomly (or pseudo-randomly) chosen
    //     values.
    // UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
    // time-low               = 4hexOctet
    // time-mid               = 2hexOctet
    // time-high-and-version  = 2hexOctet
    // clock-seq-and-reserved = hexOctet:
    // clock-seq-low          = hexOctet
    // node                   = 6hexOctet
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
    // y values are 8, 9, A, B

    const cryptoObj: Crypto = window.crypto; // for IE 11
    if (cryptoObj && cryptoObj.getRandomValues) {
      const buffer: Uint8Array = new Uint8Array(16);
      cryptoObj.getRandomValues(buffer);

      //buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
      buffer[6] |= 0x40; //buffer[6] | 01000000 will set the 6 bit to 1.
      buffer[6] &= 0x4f; //buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".

      //buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
      buffer[8] |= 0x80; //buffer[8] | 10000000 will set the 7 bit to 1.
      buffer[8] &= 0xbf; //buffer[8] & 10111111 will set the 6 bit to 0.

      return Utils.decimalToHex(buffer[0]) + Utils.decimalToHex(buffer[1])
        + Utils.decimalToHex(buffer[2]) + Utils.decimalToHex(buffer[3])
        + "-" + Utils.decimalToHex(buffer[4]) + Utils.decimalToHex(buffer[5])
        + "-" + Utils.decimalToHex(buffer[6]) + Utils.decimalToHex(buffer[7])
        + "-" + Utils.decimalToHex(buffer[8]) + Utils.decimalToHex(buffer[9])
        + "-" + Utils.decimalToHex(buffer[10]) + Utils.decimalToHex(buffer[11])
        + Utils.decimalToHex(buffer[12]) + Utils.decimalToHex(buffer[13])
        + Utils.decimalToHex(buffer[14]) + Utils.decimalToHex(buffer[15]);
    }
    else {
      const guidHolder: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
      const hex: string = "0123456789abcdef";
      let r: number = 0;
      let guidResponse: string = "";
      for (let i: number = 0; i < 36; i++) {
        if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
          // each x and y needs to be random
          r = Math.random()  * 16 | 0;
        }
        if (guidHolder[i] === "x") {
          guidResponse += hex[r];
        } else if (guidHolder[i] === "y") {
          // clock-seq-and-reserved first hex is filtered and remaining hex values are random
          r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
          r |= 0x8; // set pos 3 to 1 as 1???
          guidResponse += hex[r];
        } else {
          guidResponse += guidHolder[i];
        }
      }
      return guidResponse;
    }
  }

  /*
   * Parses out the components from a url string.
   * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
   */
  static GetUrlComponents(url: string): IUri {
    if (!url) {
      throw "Url required";
    }

    // https://gist.github.com/curtisz/11139b2cfcaef4a261e0
    var regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");

    var match = url.match(regEx);

    if (!match || match.length < 6) {
      throw "Valid url required";
    }

    let urlComponents = <IUri>{
      Protocol: match[1],
      HostNameAndPort: match[4],
      AbsolutePath: match[5]
    };

    let pathSegments = urlComponents.AbsolutePath.split("/");
    pathSegments = pathSegments.filter((val) => val && val.length > 0); // remove empty elements
    urlComponents.PathSegments = pathSegments;
    return urlComponents;
  }

  /*
   * Given a url or path, append a trailing slash if one doesnt exist
   */
  static CanonicalizeUri(url: string): string {
    if (url) {
      url = url.toLowerCase();
    }

    if (url && !Utils.endsWith(url, "/")) {
      url += "/";
    }

    return url;
  }

  /*
    * Checks to see if the url ends with the suffix
    * Required because we are compiling for es5 instead of es6
    * @param url
    * @param str
    */
  static endsWith(url: string, suffix: string): boolean {
    if (!url || !suffix) {
      return false;
    }

    return url.indexOf(suffix, url.length - suffix.length) !== -1;
  }
}
