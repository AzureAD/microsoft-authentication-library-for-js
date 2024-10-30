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
    B2C_MSA_TEST_UPN,
} from "./Constants";
export { BrowserCacheUtils } from "./BrowserCacheTestUtils";
export { Browser, Page, BrowserContext } from "puppeteer";
export { NodeCacheTestUtils } from "./NodeCacheTestUtils";
export { storagePoller } from "./TestUtils";
export { getKeyVaultSecretClient, getCredentials } from "./KeyVaultUtils";
export {
    Screenshot as ScreenShotElectron,
    enterCredentials as enterCredentialsElectron,
    retrieveAuthCodeUrlFromBrowserContext,
} from "./ElectronPlaywrightTestUtils";
