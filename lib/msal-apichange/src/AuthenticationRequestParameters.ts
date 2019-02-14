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

import { Authority } from "./Authority";
import { Utils } from "./Utils";
import { Constants } from "./Constants";
import { AuthenticationParameters } from "./Request";

/**
 * Class to construct the Request to be sent to the Auth Server for Authentication/Authorization
 * 
 * @hidden
 */
export class AuthenticationRequestParameters {

  authorityInstance: Authority;
  clientId: string;
  nonce: string;
  state: string;
  correlationId: string;
  xClientVer: string;
  xClientSku: string;
  scopes: Array<string>;
  responseType: string;
  promptValue: string;
  extraQueryParameters: string;
  loginHint: string;
  domainHint: string;
  redirectUri: string;

  public get authority(): string {
    return this.authorityInstance ? this.authorityInstance.CanonicalAuthority : null;
  }

  constructor(authority: Authority, clientId: string, scope: Array<string>, responseType: string, redirectUri: string, state: string) {

    // Passed from the user request and/or defaults from UserAgentApplication
    this.authorityInstance = authority;
    this.clientId = clientId;
    this.scopes = scope;
    this.responseType = responseType;
    this.redirectUri = redirectUri;
  
    // randomly generated values
    // TODO: expand on CorrelationID, State and Nonce here and in documentation, may be add a link?
    this.correlationId = Utils.createNewGuid();
    this.state = state && !Utils.isEmpty(state) ? Utils.createNewGuid() + "|" + state : Utils.createNewGuid();
    this.nonce = Utils.createNewGuid();
    
    // telemetry information
    // TODO: expand why we need this
    this.xClientSku = "MSAL.JS";
    this.xClientVer = Utils.getLibraryVersion();
  }

  /**
   * Construct Navigate URL from scopes
   * @param scopes 
   */
  createNavigateUrl(scopes: Array<string>): string {

    var str = this.createNavigationUrlString(scopes);
    let authEndpoint: string = this.authorityInstance.AuthorizationEndpoint;

    // if the endpoint already has queryparams, lets add to it, otherwise add the first one
    if (authEndpoint.indexOf("?") < 0) {
      authEndpoint += "?";
    } else {
      authEndpoint += "&";
    }

    let requestUrl: string = `${authEndpoint}${str.join("&")}`;
    return requestUrl;
  }

  /**
   * Add the query string with appropriate values to the navigate URL
   * @param scopes 
   */
  createNavigationUrlString(scopes: Array<string>): Array<string> {

    if (!scopes) {
      scopes = [this.clientId];
    }

    if (scopes.indexOf(this.clientId) === -1) {
      scopes.push(this.clientId);
    }

    const str: Array<string> = [];
    str.push("response_type=" + this.responseType);

    // add default scopes
    this.translateclientIdUsedInScope(scopes);

    // add all other params in the Query String
    str.push("scope=" + encodeURIComponent(this.parseScope(scopes)));
    str.push("client_id=" + encodeURIComponent(this.clientId));
    str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));
    str.push("state=" + encodeURIComponent(this.state));
    str.push("nonce=" + encodeURIComponent(this.nonce));
    str.push("client_info=1");
    str.push(`x-client-SKU=${this.xClientSku}`);
    str.push(`x-client-Ver=${this.xClientVer}`);

    // TODO: edit the code here - remove other assumed extraparams and add the added parameters here
    if (this.extraQueryParameters) {
      str.push(this.extraQueryParameters);
    }

    str.push("client-request-id=" + encodeURIComponent(this.correlationId));

    return str;
  }

  /**
   * Add default OpenID scopes 'openid' and 'profile'
   * @param scopes 
   */
  translateclientIdUsedInScope(scopes: Array<string>): void {
    const clientIdIndex: number = scopes.indexOf(this.clientId);
    if (clientIdIndex >= 0) {
      scopes.splice(clientIdIndex, 1);
      if (scopes.indexOf("openid") === -1) {
        scopes.push("openid");
      }
      if (scopes.indexOf("profile") === -1) {
        scopes.push("profile");
      }
    }
  }

  /**
   * Parse Scopes into an array List to return
   * @param scopes 
   */
  parseScope(scopes: Array<string>): string {
    let scopeList: string = "";
    if (scopes) {
      for (let i: number = 0; i < scopes.length; ++i) {
        scopeList += (i !== scopes.length - 1) ? scopes[i] + " " : scopes[i];
      }
    }

    return scopeList;
  }
}
