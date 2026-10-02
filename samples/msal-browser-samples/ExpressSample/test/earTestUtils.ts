import * as puppeteer from "puppeteer";

const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

export interface EarFlowDiagnostics {
    authorizeWasPost: boolean;
    encryptedResponseObserved: boolean;
}

export function observeEarFlow(target: puppeteer.Page): EarFlowDiagnostics {
    const diagnostics: EarFlowDiagnostics = {
        authorizeWasPost: false,
        encryptedResponseObserved: false,
    };

    target.on("request", (request) => {
        if (
            request.url().includes("/authorize") &&
            request.method() === "POST"
        ) {
            diagnostics.authorizeWasPost = true;
        }
    });
    target.on("framenavigated", (frame) => {
        try {
            if (new URL(frame.url()).hash.includes("ear_jwe=")) {
                diagnostics.encryptedResponseObserved = true;
            }
        } catch {
            // Ignore non-URL frame targets such as about:blank.
        }
    });

    return diagnostics;
}

export async function getEarDecryptCount(
    target: puppeteer.Page
): Promise<number> {
    return target.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
}

export async function installEarDecryptSpy(
    target: puppeteer.Page,
    origin: string
): Promise<void> {
    await target.evaluateOnNewDocument(
        (config: { origin: string; key: string }) => {
            try {
                if (window.location.origin !== config.origin) {
                    return;
                }
                if (!window.crypto || !window.crypto.subtle) {
                    return;
                }
                const realDecrypt = window.crypto.subtle.decrypt.bind(
                    window.crypto.subtle
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window.crypto.subtle as any).decrypt = function (
                    algorithm: AlgorithmIdentifier,
                    key: CryptoKey,
                    data: BufferSource
                ) {
                    const algName =
                        typeof algorithm === "string"
                            ? algorithm
                            : algorithm.name;
                    if (algName === "AES-GCM") {
                        try {
                            const next =
                                parseInt(
                                    window.sessionStorage.getItem(config.key) ||
                                        "0",
                                    10
                                ) + 1;
                            window.sessionStorage.setItem(
                                config.key,
                                String(next)
                            );
                        } catch {
                            // The auth flow remains authoritative if storage is unavailable.
                        }
                    }
                    return realDecrypt(algorithm, key, data);
                };
            } catch {
                // The auth flow remains authoritative if the diagnostic spy fails.
            }
        },
        { origin, key: EAR_DECRYPT_COUNT_KEY }
    );
}
