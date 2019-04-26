// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

  promptValue: string;
  claimsValue: string;

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
    const str = this.createNavigationUrlString(scopes);
    let authEndpoint: string = this.authorityInstance.AuthorizationEndpoint;
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
    if (!scopes) {
      scopes = [this.clientId];
    }

    if (scopes.indexOf(this.clientId) === -1) {
      scopes.push(this.clientId);
    }
    const str: Array<string> = [];
    str.push("response_type=" + this.responseType);

    this.translateclientIdUsedInScope(scopes);
    str.push("scope=" + encodeURIComponent(this.parseScope(scopes)));
    str.push("client_id=" + encodeURIComponent(this.clientId));
    str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));

    str.push("state=" + encodeURIComponent(this.state));
    str.push("nonce=" + encodeURIComponent(this.nonce));

    str.push("client_info=1");
    str.push(`x-client-SKU=${this.xClientSku}`);
    str.push(`x-client-Ver=${this.xClientVer}`);
    if (this.promptValue) {
      str.push("prompt=" + encodeURIComponent(this.promptValue));
    }

    if (this.claimsValue) {
      str.push("claims=" + encodeURIComponent(this.claimsValue));
    }

    if (this.queryParameters) {
      str.push(this.queryParameters);
    }

    if (this.extraQueryParameters) {
      str.push(this.extraQueryParameters);
    }

    str.push("client-request-id=" + encodeURIComponent(this.correlationId));
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
