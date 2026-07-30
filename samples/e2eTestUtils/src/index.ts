/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    enterCredentialsADFS,
    enterCredentialsADFSWithConsent,
    validateCacheLocation,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    clickLoginPopup,
    clickLoginRedirect,
    waitForReturnToApp,
    approveRemoteConnect,
    enterDeviceCode,
    clickSignIn,
    b2cAadPpeAccountEnterCredentials,
    b2cLocalAccountEnterCredentials,
    b2cMsaAccountEnterCredentials,
    retrieveAppConfiguration,
    clickLogoutPopup,
    clickLogoutRedirect,
    RETRY_TIMES,
    SAMPLE_HOME_URL,
    ONE_SECOND_IN_MS,
    SUCCESSFUL_GRAPH_CALL_ID,
    SUCCESSFUL_GET_ALL_ACCOUNTS_ID,
    SUCCESSFUL_SILENT_TOKEN_ACQUISITION_ID,
    SCREENSHOT_BASE_FOLDER_NAME,
} from "./TestUtils";
export { LabClient } from "./LabClient";
export type { LabApiQueryParams } from "./LabApiQueryParams";
export {
    AzureEnvironments,
    AppTypes,
    FederationProviders,
    UserTypes,
    B2cProviders,
    ENV_VARIABLES,
    LAB_KEY_VAULT_URL,
    LAB_CERT_NAME,
    MOBILE_BUILD_VAULT_URL,
    MSAL_TEAM_KEY_VAULT_URL,
    UPN_JSON_SECRET_NAME,
    AppConfigSecrets,
    SubmitButtonSelectors,
} from "./Constants";
export {
    BrowserCacheUtils,
    isCachedTokenEncrypted,
} from "./BrowserCacheTestUtils";
export {
    DeviceSigninState,
    KmsiSelectors,
    decodeBase64Url,
    decodeJwtPayload,
    getIdTokenClaimsFromCache,
    selectKmsiOption,
    assertKmsiSigninState,
    assertSigninStateContains,
    verifyKmsiFromCache,
} from "./KmsiTestUtils";
export { Browser, Page, BrowserContext, Frame } from "puppeteer";
export { NodeCacheTestUtils } from "./NodeCacheTestUtils";
export { storagePoller } from "./TestUtils";
export { getKeyVaultSecretClient, getCredentials } from "./KeyVaultUtils";
export { getCertificateInfo } from "./CertificateUtils";
export { callGraphOverMtls } from "./MtlsResourceUtils";
export type { MtlsResourceResponse } from "./MtlsResourceUtils";
export {
    Screenshot as ScreenShotElectron,
    enterCredentials as enterCredentialsElectron,
    retrieveAuthCodeUrlFromBrowserContext,
} from "./ElectronPlaywrightTestUtils";
