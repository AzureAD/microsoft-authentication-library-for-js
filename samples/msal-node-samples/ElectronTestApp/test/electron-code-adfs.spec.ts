import * as path from 'path';

import { ElectronApplication, Page, _electron as electron, test, expect } from "@playwright/test";

import { setupCredentials } from "../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments, FederationProviders, UserTypes } from "../../../e2eTestUtils/Constants";

import {
    Screenshot,
    clickSignIn,
    enterCredentialsADFS,
} from '../../../e2eTestUtils/ElectronPlaywrightTestUtils';

import {
    SCREENSHOT_BASE_FOLDER_NAME,
    validateCacheLocation,
} from '../../testUtils'

import config from '../src/config/ADFS.json';

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/../data/adfs.cache.json`;

test.describe('Electron Auth Code ADFS 2019 Tests ', () => {
    let electronApp: ElectronApplication;
    let page: Page;

    let username: string;
    let accountPwd: string;

    const screenshotFolder = `${SCREENSHOT_BASE_FOLDER_NAME}/ElectronTestApp/adfs`;

    test.beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            federationProvider: FederationProviders.ADFS2019,
            userType: UserTypes.FEDERATED
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        electronApp = await electron.launch({
            args: [path.join(__dirname, "../dist/App.js"),
            '--enable-logging',
            '--skip-welcome',
            '--disable-telemetry',
            '--no-cached-data',
            ],
            env: {
                automation: "1",
                authConfig: JSON.stringify(config)
            }
        });

        await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
    });

    test.describe('Acquire token', () => {
        test.beforeEach(async () => {
            page = await electronApp.firstWindow();
        });

        test.afterEach(async () => {
            await page.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        test('Acquire token by auth code', async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/AcquireTokenAuthCode`);
            const popupPage = await clickSignIn(electronApp, page, screenshot);

            await enterCredentialsADFS(popupPage, screenshot, username, accountPwd);

            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);

            await expect(page.locator(`text=${username}`).first()).toBeVisible();
        });
    });
});
