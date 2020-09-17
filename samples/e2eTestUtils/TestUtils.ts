import fs from "fs";
import puppeteer from "puppeteer";
import { LabClient } from "./LabClient";
import { LabConfig } from "./LabConfig";
import { Configuration } from "../../lib/msal-browser";

export class Screenshot {
    private folderName: string;
    private screenshotNum: number;

    constructor (foldername: string) {
        this.folderName = foldername
        this.screenshotNum = 0;
        createFolder(this.folderName);
    }

    async takeScreenshot(page: puppeteer.Page, screenshotName: string): Promise<void> {
        await page.screenshot({ path: `${this.folderName}/${++this.screenshotNum}_${screenshotName}.png` });
    }
}

export function createFolder(foldername: string) {
    if (!fs.existsSync(foldername)) {
        fs.mkdirSync(foldername);
    }
}

export async function setupCredentials(labConfig: LabConfig, labClient: LabClient): Promise<[string, string]> {
    let username = "";
    let accountPwd = "";

    if (labConfig.user.upn) {
        username = labConfig.user.upn;
    }

    const testPwdSecret = await labClient.getSecret(labConfig.lab.labName);

    accountPwd = testPwdSecret.value;

    return [username, accountPwd];
}

export function buildConfig(labConfig: LabConfig): Configuration {
    const msalConfig: Configuration = {
        auth: {
            clientId: labConfig.app.appId
        }
    };

    if (labConfig.lab.authority.endsWith("/")) {
        msalConfig.auth.authority = labConfig.lab.authority + labConfig.user.tenantID;
    } else {
        msalConfig.auth.authority = `${labConfig.lab.authority}/${labConfig.user.tenantID}`;
    }

    return msalConfig;
}
