// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Account } from "./Account";
import {Constants, SSOTypes} from "./Constants";
import { AuthenticationParameters, QPDict } from "./AuthenticationParameters";
import { AuthResponse } from "./AuthResponse";
import { IdToken } from "./IdToken";
import { ClientAuthError } from "./error/ClientAuthError";
import { Library } from "./Constants";
import { Base64 } from "js-base64";

/**
 * @hidden
 */
export class Utils {

  //#region General Util

  /**
   * Utils function to compare two Account objects - used to check if the same user account is logged in
   *
   * @param a1: Account object
   * @param a2: Account object
   */
  static compareAccounts(a1: Account, a2: Account): boolean {
   if (!a1 || !a2) {
          return false;
      }
    if (a1.homeAccountIdentifier && a2.homeAccountIdentifier) {
      if (a1.homeAccountIdentifier === a2.homeAccountIdentifier) {
        return true;
      }
    }
    return false;
  }

  /**
   * Decimal to Hex
   *
   * @param num
   */
  static decimalToHex(num: number): string {
    var hex: string = num.toString(16);
    while (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex;
  }

  /**
   * MSAL JS Library Version
   */
  static getLibraryVersion(): string {
    return Library.version;
  }

  /**
   * Creates a new random GUID - used to populate state?
   * @returns string (GUID)
   */
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

  //#endregion

  //#region Time

  /**
   * Returns time in seconds for expiration based on string value passed in.
   *
   * @param expires
   */
  static expiresIn(expires: string): number {
    // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
     if (!expires) {
         expires = "3599";
      }
    return this.now() + parseInt(expires, 10);
  }

  /**
   * return the current time in Unix time. Date.getTime() returns in milliseconds.
   */
  static now(): number {
    return Math.round(new Date().getTime() / 1000.0);
  }

  //#endregion

  //#region String Ops

  /**
   * Check if a string is empty
   *
   * @param str
   */
  static isEmpty(str: string): boolean {
    return (typeof str === "undefined" || !str || 0 === str.length);
  }

  //#endregion

  //#region Encode and Decode

  /**
   * encoding string to base64 - platform specific check
   *
   * @param input
   */
  static base64EncodeStringUrlSafe(input: string): string {
    // html5 should support atob function for decoding
    return Base64.encode(input);
  }

  /**
   * decoding base64 token - platform specific check
   *
   * @param base64IdToken
   */
  static base64DecodeStringUrlSafe(base64IdToken: string): string {
    // html5 should support atob function for decoding
    base64IdToken = base64IdToken.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(encodeURIComponent(Base64.decode(base64IdToken))); // jshint ignore:line
  }

  /**
   * base64 encode a string
   *
   * @param input
   */
  // TODO: Rename to specify type of encoding
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

  /**
   * utf8 encode a string
   *
   * @param input
   */
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

  /**
   * decode a base64 token string
   *
   * @param base64IdToken
   */
  // TODO: Rename to specify type of encoding
  static decode(base64IdToken: string): string {
    var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    base64IdToken = String(base64IdToken).replace(/=+$/, "");
    var length = base64IdToken.length;
    if (length % 4 === 1) {
      throw ClientAuthError.createTokenEncodingError(base64IdToken);
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

  /**
   * deserialize a string
   *
   * @param query
   */
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

  //#endregion

  //#region ExtraQueryParameters Processing (Extract?)

  /**
   * Constructs extraQueryParameters to be sent to the server for the AuthenticationParameters set by the developer
   * in any login() or acquireToken() calls
   * @param idTokenObject
   * @param extraQueryParameters
   * @param sid
   * @param loginHint
   */
  //TODO: check how this behaves when domain_hint only is sent in extraparameters and idToken has no upn.
  static constructUnifiedCacheQueryParameter(request: AuthenticationParameters, idTokenObject: any): QPDict {

    // preference order: account > sid > login_hint
    let ssoType;
    let ssoData;
    let serverReqParam: QPDict = {};
    // if account info is passed, account.sid > account.login_hint
    if (request) {
      if (request.account) {
        const account: Account = request.account;
        if (account.sid) {
          ssoType = SSOTypes.SID;
          ssoData = account.sid;
        }
        else if (account.userName) {
          ssoType = SSOTypes.LOGIN_HINT;
          ssoData = account.userName;
        }
      }
      // sid from request
      else if (request.sid) {
        ssoType = SSOTypes.SID;
        ssoData = request.sid;
      }
      // loginHint from request
      else if (request.loginHint) {
        ssoType = SSOTypes.LOGIN_HINT;
        ssoData = request.loginHint;
      }
    }
    // adalIdToken retrieved from cache
    else if (idTokenObject) {
      if (idTokenObject.hasOwnProperty(Constants.upn)) {
        ssoType = SSOTypes.ID_TOKEN;
        ssoData = idTokenObject.upn;
      }
      else {
        ssoType = SSOTypes.ORGANIZATIONS;
        ssoData = null;
      }
    }

    serverReqParam = this.addSSOParameter(ssoType, ssoData);

    // add the HomeAccountIdentifier info/ domain_hint
    if (request && request.account && request.account.homeAccountIdentifier) {
        serverReqParam = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, request.account.homeAccountIdentifier, serverReqParam);
    }

    return serverReqParam;
  }


  /**
   * Add SID to extraQueryParameters
   * @param sid
   */
  static addSSOParameter(ssoType: string, ssoData: string, ssoParam?: QPDict): QPDict {
    if (!ssoParam) {
      ssoParam = {};
    }

    if (!ssoData) {
        return ssoParam;
    }

    switch (ssoType) {
      case SSOTypes.SID: {
        ssoParam[SSOTypes.SID] = ssoData;
        break;
      }
      case SSOTypes.ID_TOKEN: {
        ssoParam[SSOTypes.LOGIN_HINT] = ssoData;
        ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.ORGANIZATIONS;
        break;
      }
      case SSOTypes.LOGIN_HINT: {
        ssoParam[SSOTypes.LOGIN_HINT] = ssoData;
        break;
      }
      case SSOTypes.ORGANIZATIONS: {
        ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.ORGANIZATIONS;
        break;
      }
      case SSOTypes.CONSUMERS: {
        ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.CONSUMERS;
        break;
      }
      case SSOTypes.HOMEACCOUNT_ID: {
        let homeAccountId = ssoData.split(".");
        const uid = Utils.base64DecodeStringUrlSafe(homeAccountId[0]);
        const utid = Utils.base64DecodeStringUrlSafe(homeAccountId[1]);

        // TODO: domain_req and login_req are not needed according to eSTS team
        ssoParam[SSOTypes.LOGIN_REQ] = uid;
        ssoParam[SSOTypes.DOMAIN_REQ] = utid;

        if (utid === Constants.consumersUtid) {
            ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.CONSUMERS;
        }
        else {
            ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.ORGANIZATIONS;
        }
        break;
      }
      case SSOTypes.LOGIN_REQ: {
        ssoParam[SSOTypes.LOGIN_REQ] = ssoData;
        break;
      }
      case SSOTypes.DOMAIN_REQ: {
        ssoParam[SSOTypes.DOMAIN_REQ] = ssoData;
        break;
      }
    }

    return ssoParam;
  }

  /**
   * Utility to generate a QueryParameterString from a Key-Value mapping of extraQueryParameters passed
   * @param extraQueryParameters
   */
  static generateQueryParametersString(queryParameters: QPDict): string {
    let paramsString: string = null;

    if (queryParameters) {
      Object.keys(queryParameters).forEach((key: string) => {
        if (paramsString == null) {
          paramsString = `${key}=${encodeURIComponent(queryParameters[key])}`;
        }
        else {
          paramsString += `&${key}=${encodeURIComponent(queryParameters[key])}`;
        }
     });
    }

    return paramsString;
  }

  /**
   * Check to see if there are SSO params set in the Request
   * @param request
   */
  static isSSOParam(request: AuthenticationParameters) {
      return request && (request.account || request.sid || request.loginHint);
  }

  //#endregion

}
