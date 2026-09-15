import {
    AppTypes,
    AzureEnvironments,
    LabApiQueryParams,
    LabClient,
    Page as PuppeteerPage,
    setupCredentials,
} from "e2e-test-utils";
import { BrowserContext, Frame, Page as PlaywrightPage } from "playwright-core";

const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

export interface LabCredentials {
    username: string;
    password: string;
}

export async function getLabCredentials(): Promise<LabCredentials> {
    const labApiParams: LabApiQueryParams = {
        azureEnvironment: AzureEnvironments.CLOUD,
        appType: AppTypes.CLOUD,
    };
    const labClient = new LabClient();
    const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
    const [username, password] = await setupCredentials(
        envResponse[0],
        labClient
    );

    return { username, password };
}

export async function installPuppeteerEarDecryptSpy(
    page: PuppeteerPage
): Promise<void> {
    await page.evaluateOnNewDocument((key: string) => {
        try {
            if (!window.crypto || !window.crypto.subtle) {
                return;
            }
            const realDecrypt = window.crypto.subtle.decrypt.bind(
                window.crypto.subtle
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.crypto.subtle as any).decrypt = function (
                algorithm: AlgorithmIdentifier,
                cryptoKey: CryptoKey,
                data: BufferSource
            ) {
                const algName =
                    typeof algorithm === "string" ? algorithm : algorithm.name;
                if (algName === "AES-GCM") {
                    try {
                        const next =
                            parseInt(
                                window.sessionStorage.getItem(key) || "0",
                                10
                            ) + 1;
                        window.sessionStorage.setItem(key, String(next));
                    } catch {
                        // Storage is best-effort test instrumentation.
                    }
                }
                return realDecrypt(algorithm, cryptoKey, data);
            };
        } catch {
            // The spy must never interfere with authentication.
        }
    }, EAR_DECRYPT_COUNT_KEY);
}

export async function getPuppeteerEarDecryptCount(
    page: PuppeteerPage
): Promise<number> {
    return page.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
}

export async function installEarDecryptSpy(
    context: BrowserContext
): Promise<void> {
    await context.addInitScript((key: string) => {
        try {
            if (!window.crypto || !window.crypto.subtle) {
                return;
            }
            const realDecrypt = window.crypto.subtle.decrypt.bind(
                window.crypto.subtle
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.crypto.subtle as any).decrypt = function (
                algorithm: AlgorithmIdentifier,
                cryptoKey: CryptoKey,
                data: BufferSource
            ) {
                const algName =
                    typeof algorithm === "string" ? algorithm : algorithm.name;
                if (algName === "AES-GCM") {
                    try {
                        const next =
                            parseInt(
                                window.sessionStorage.getItem(
                                    EAR_DECRYPT_COUNT_KEY
                                ) || "0",
                                10
                            ) + 1;
                        window.sessionStorage.setItem(
                            EAR_DECRYPT_COUNT_KEY,
                            String(next)
                        );
                    } catch {
                        // Storage is best-effort test instrumentation.
                    }
                }
                return realDecrypt(algorithm, cryptoKey, data);
            };
        } catch {
            // The spy must never interfere with authentication.
        }
    }, EAR_DECRYPT_COUNT_KEY);
}

export async function getEarDecryptCount(
    page: PlaywrightPage | Frame
): Promise<number> {
    return page.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
}
