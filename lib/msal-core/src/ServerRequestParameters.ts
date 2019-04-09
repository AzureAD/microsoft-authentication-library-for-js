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

/**
 * Nonce: OIDC Nonce definition: https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 * State: OAuth Spec: https://tools.ietf.org/html/rfc6749#section-10.12
 * @hidden
 */
export class ServerRequestParameters {

  authorityInstance: Authority;
  clientId: string;
  scopes: Array<string>;

  nonce: string;
  state: string;

  // telemetry information
  xClientVer: string;
  xClientSku: string;
  correlationId: string;

  responseType: string;
  redirectUri: string;

  // TODO: The below are not used - check and delete with the rename PR
  promptValue: string;
  sid: string;
  loginHint: string;
  domainHint: string;
  loginReq: string;
  domainReq: string;

  queryParameters: string;
  extraQueryParameters: string;

  public get authority(): string {
    return this.authorityInstance ? this.authorityInstance.CanonicalAuthority : null;
  }

  /**
   * Constructor
   * @param authority
   * @param clientId
   * @param scope
   * @param responseType
   * @param redirectUri
   * @param state
   */
  constructor (authority: Authority, clientId: string, scope: Array<string>, responseType: string, redirectUri: string, state: string ) {
    this.authorityInstance = authority;
    this.clientId = clientId;
    this.scopes = scope;

    this.nonce = Utils.createNewGuid();
    this.state = state && !Utils.isEmpty(state) ?  Utils.createNewGuid() + "|" + state   : Utils.createNewGuid();

    // TODO: Change this to user passed vs generated with the new PR
    this.correlationId = Utils.createNewGuid();

    // telemetry information
    this.xClientSku = "MSAL.JS";
    this.xClientVer = Utils.getLibraryVersion();

    this.responseType = responseType;
    this.redirectUri = redirectUri;

  }

  /**
   * generates the URL with QueryString Parameters
   * @param scopes
   */
  createNavigateUrl(scopes: Array<string>): string {
    console.log("createNavUrl");
    const str = this.createNavigationUrlString(scopes);
    let authEndpoint: string = this.authorityInstance.AuthorizationEndpoint;
    console.log("authEndpt: " + authEndpoint);
    // if the endpoint already has queryparams, lets add to it, otherwise add the first one
    if (authEndpoint.indexOf("?") < 0) {
      authEndpoint += "?";
    } else {
      authEndpoint += "&";
    }

    const requestUrl: string = `${authEndpoint}${str.join("&")}`;
    return requestUrl;
  }

  /**
   * Generate the array of all QueryStringParams to be sent to the server
   * @param scopes
   */
  createNavigationUrlString(scopes: Array<string>): Array<string> {
    console.log("createNavUrlString");
    if (!scopes) {
      scopes = [this.clientId];
    }

    if (scopes.indexOf(this.clientId) === -1) {
      scopes.push(this.clientId);
    }
    console.log("brk 1");
    const str: Array<string> = [];
    str.push("response_type=" + this.responseType);

    this.translateclientIdUsedInScope(scopes);
    console.log("brk 2");
    str.push("scope=" + encodeURIComponent(this.parseScope(scopes)));
    str.push("client_id=" + encodeURIComponent(this.clientId));
    str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));

    str.push("state=" + encodeURIComponent(this.state));
    str.push("nonce=" + encodeURIComponent(this.nonce));

    str.push("client_info=1");
    str.push(`x-client-SKU=${this.xClientSku}`);
    str.push(`x-client-Ver=${this.xClientVer}`);
    console.log("brk 3");
    if (this.promptValue) {
      str.push("prompt=" + encodeURI(this.promptValue));
    }

    if (this.queryParameters) {
      str.push(this.queryParameters);
    }

    if (this.extraQueryParameters) {
      str.push(this.extraQueryParameters);
    }

    str.push("client-request-id=" + encodeURIComponent(this.correlationId));
    console.log("brk 4");
    console.log("URLstring: " + str);
    return str;
  }

  /**
   * append the required scopes: https://openid.net/specs/openid-connect-basic-1_0.html#Scopes
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
   * Parse the scopes into a formatted scopeList
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
