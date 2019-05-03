// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Logger } from "./Logger";
import { Utils } from "./Utils";

// make CacheStorage a fixed type to limit it to specific inputs
export type CacheLocation = "localStorage" | "sessionStorage";

/**
 * Defaults for the Configuration Options
 */
const FRAME_TIMEOUT = 6000;
const OFFSET = 300;
const NAVIGATE_FRAME_WAIT = 500;


/**
 *  Authentication Options
 *
 *  clientId                    - Client ID assigned to your app by Azure Active Directory
 *  authority                   - Developer can choose to send an authority, defaults to " "
 *                                  (TODO: Follow up with the authority discussion with the PMs - Until then this comment is a placeholder)
 *  validateAuthority           - Used to turn authority validation on/off. When set to true (default), MSAL will compare the application's authority
 *                                  against well-known URLs templates representing well-formed authorities.
 *                                  It is useful when the authority is obtained at run time to prevent MSAL from displaying authentication prompts from malicious pages.
 *  redirectUri                 - The redirect URI of the application, this should be same as the value in the application registration portal.
 *                                  Defaults to `window.location.href`.
 *  postLogoutRedirectUri       - Used to redirect the user to this location after logout. Defaults to `window.location.href`.
 *  state                       - Use to send the state parameter with authentication request
 *  navigateToLoginRequestUrl   - Used to turn off default navigation to start page after login. Default is true. This is used only for redirect flows.
 *
 */
export type AuthOptions = {
  clientId: string;
  authority?: string;
  validateAuthority?: boolean;
  redirectUri?: string | (() => string);
  postLogoutRedirectUri?: string | (() => string);
  navigateToLoginRequestUrl?: boolean;
};

/**
 * Cache Options
 *
 * cacheLocation            - Used to specify the cacheLocation user wants to set: Valid values are "localStorage" and "sessionStorage"
 * storeAuthStateInCookie   - If set, the library will store the auth request state required for validation of the auth flows in the browser cookies.
 *                              By default this flag is set to false.
 */
export type CacheOptions = {
  cacheLocation?: CacheLocation;
  storeAuthStateInCookie?: boolean;
};

/**
 * Library Specific Options
 *
 * logger                       - Used to initialize the Logger object; TODO: Expand on logger details or link to the documentation on logger
 * loadFrameTimeout             - maximum time the library should wait for a frame to load
 * tokenRenewalOffsetSeconds    - sets the window of offset needed to renew the token before expiry
 *
 */
export type SystemOptions = {
  logger?: Logger;
  loadFrameTimeout?: number;
  tokenRenewalOffsetSeconds?: number;
  navigateFrameWait?: number;
};

/**
 * App/Framework specific environment Support
 *
 * isAngular                - flag set to determine if it is Angular Framework. Used to broadcast tokens. TODO: detangle this dependency from core.
 * unprotectedResources     - Array of URI's which are unprotected resources. MSAL will not attach a token to outgoing requests that have these URI. Defaults to 'null'.
 * protectedResourceMap     - This is mapping of resources to scopes used by MSAL for automatically attaching access tokens in web API calls.
 *                              A single access token is obtained for the resource. So you can map a specific resource path as follows:
 *                              {"https://graph.microsoft.com/v1.0/me", ["user.read"]},
 *                              or the app URL of the resource as: {"https://graph.microsoft.com/", ["user.read", "mail.send"]}.
 *                              This is required for CORS calls.
 *
 */
export type FrameworkOptions = {
  isAngular?: boolean;
  unprotectedResources?: Array<string>;
  protectedResourceMap?: Map<string, Array<string>>;
};

/**
 * Configuration Object
 */
export type Configuration = {
  auth: AuthOptions,
  cache?: CacheOptions,
  system?: SystemOptions,
  framework?: FrameworkOptions
};

const DEFAULT_AUTH_OPTIONS: AuthOptions = {
  clientId: "",
  authority: null,
  validateAuthority: true,
  redirectUri: () => Utils.getDefaultRedirectUri(),
  postLogoutRedirectUri: () => Utils.getDefaultRedirectUri(),
  navigateToLoginRequestUrl: true
};

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  cacheLocation: "sessionStorage",
  storeAuthStateInCookie: false
};

const DEFAULT_SYSTEM_OPTIONS: SystemOptions = {
  logger: new Logger(null),
  loadFrameTimeout: FRAME_TIMEOUT,
  tokenRenewalOffsetSeconds: OFFSET,
  navigateFrameWait: NAVIGATE_FRAME_WAIT
};

const DEFAULT_FRAMEWORK_OPTIONS: FrameworkOptions = {
  isAngular: false,
  unprotectedResources: new Array<string>(),
  protectedResourceMap: new Map<string, Array<string>>()
};

/**
 * Function to set the default options when not explicitly set
 *
 * @param TAuthOptions
 * @param TCacheOptions
 * @param TSystemOptions
 * @param TFrameworkOptions
 *
 * @returns TConfiguration object
 */

// destructure with default settings
export function buildConfiguration({ auth, cache = {}, system = {}, framework = {}}: Configuration): Configuration {
  const overlayedConfig: Configuration = {
    auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
    cache: { ...DEFAULT_CACHE_OPTIONS, ...cache },
    system: { ...DEFAULT_SYSTEM_OPTIONS, ...system },
    framework: { ...DEFAULT_FRAMEWORK_OPTIONS, ...framework }
  };
  return overlayedConfig;
}

