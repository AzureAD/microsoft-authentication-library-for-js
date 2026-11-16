import * as puppeteer from "puppeteer";

type ObservedRequest = {
    method: string;
    url: string;
};

export class AuthenticationFlowTestUtils {
    private readonly requests: ObservedRequest[] = [];
    private readonly fragmentParameters = new Map<string, number>();
    private readonly earRequests: {
        method: string;
        algorithm: string;
        curve?: string;
        hasApv: boolean;
        hasPrivateKey: boolean;
    }[] = [];

    constructor(private readonly page: puppeteer.Page) {
        page.on("request", (request) => {
            this.requests.push({
                method: request.method(),
                url: request.url(),
            });
            if (
                request.method() === "POST" &&
                request.url().includes("/authorize")
            ) {
                const parameters = new URLSearchParams(request.postData());
                if (parameters.has("ear_jwk")) {
                    try {
                        const decode = (value: string) =>
                            JSON.parse(
                                Buffer.from(
                                    decodeURIComponent(value),
                                    "base64"
                                ).toString("utf8")
                            );
                        const jwk = decode(parameters.get("ear_jwk") || "");
                        const controls = decode(
                            parameters.get("ear_jwe_crypto") || ""
                        );
                        this.earRequests.push({
                            method: request.method(),
                            algorithm: controls.alg,
                            curve: jwk.crv,
                            hasApv:
                                typeof controls.apv === "string" &&
                                controls.apv.length > 0,
                            hasPrivateKey: "d" in jwk || "k" in jwk,
                        });
                    } catch {
                        this.earRequests.push({
                            method: request.method(),
                            algorithm: "invalid",
                            hasApv: false,
                            hasPrivateKey: false,
                        });
                    }
                }
            }
        });
        page.on("framenavigated", (frame) => {
            try {
                const hash = new URL(frame.url()).hash.slice(1);
                new URLSearchParams(hash).forEach((_value, key) => {
                    this.fragmentParameters.set(
                        key,
                        (this.fragmentParameters.get(key) || 0) + 1
                    );
                });
            } catch {
                // Ignore non-URL frame targets such as about:blank.
            }
        });
    }

    getRequestCount(urlFragment: string, method?: string): number {
        return this.requests.filter(
            (request) =>
                request.url.includes(urlFragment) &&
                (!method || request.method === method)
        ).length;
    }

    getFragmentParameterCount(parameter: string): number {
        return this.fragmentParameters.get(parameter) || 0;
    }

    getEarRequests(): {
        method: string;
        algorithm: string;
        curve?: string;
        hasApv: boolean;
        hasPrivateKey: boolean;
    }[] {
        return this.earRequests;
    }

    async installCryptoOperationSpy(
        origin: string,
        algorithmName: string
    ): Promise<void> {
        await this.page.evaluateOnNewDocument(
            (config: {
                algorithmName: string;
                origin: string;
                storageKey: string;
                statusKey: string;
            }) => {
                try {
                    if (
                        window.location.origin !== config.origin ||
                        !window.crypto?.subtle
                    ) {
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
                        const operationAlgorithm =
                            typeof algorithm === "string"
                                ? algorithm
                                : algorithm.name;
                        if (operationAlgorithm === config.algorithmName) {
                            try {
                                const next =
                                    parseInt(
                                        window.sessionStorage.getItem(
                                            config.storageKey
                                        ) || "0",
                                        10
                                    ) + 1;
                                window.sessionStorage.setItem(
                                    config.storageKey,
                                    String(next)
                                );
                            } catch {
                                // The authentication flow remains authoritative.
                            }
                        }
                        return realDecrypt(algorithm, key, data);
                    };
                    window.sessionStorage.setItem(
                        config.statusKey,
                        "installed"
                    );
                } catch (error) {
                    try {
                        window.sessionStorage.setItem(
                            config.statusKey,
                            `failed:${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`
                        );
                    } catch {
                        // Authentication remains authoritative if diagnostics fail.
                    }
                }
            },
            {
                algorithmName,
                origin,
                storageKey:
                    AuthenticationFlowTestUtils.getCryptoOperationStorageKey(
                        algorithmName
                    ),
                statusKey:
                    AuthenticationFlowTestUtils.getCryptoOperationStatusKey(
                        algorithmName
                    ),
            }
        );
    }

    async assertCryptoOperationSpyInstalled(
        algorithmName: string
    ): Promise<void> {
        const status = await this.page.evaluate(
            (statusKey) => window.sessionStorage.getItem(statusKey),
            AuthenticationFlowTestUtils.getCryptoOperationStatusKey(
                algorithmName
            )
        );
        if (status !== "installed") {
            const detail = status?.startsWith("failed:")
                ? status.slice("failed:".length)
                : "the page did not report an installation result";
            throw new Error(
                `WebCrypto ${algorithmName} decrypt instrumentation was not installed: ${detail}`
            );
        }
    }

    async getCryptoOperationCount(algorithmName: string): Promise<number> {
        return this.page.evaluate(
            (storageKey) =>
                parseInt(window.sessionStorage.getItem(storageKey) || "0", 10),
            AuthenticationFlowTestUtils.getCryptoOperationStorageKey(
                algorithmName
            )
        );
    }

    private static getCryptoOperationStorageKey(algorithmName: string): string {
        return `__cryptoOperationCount:${algorithmName}`;
    }

    private static getCryptoOperationStatusKey(algorithmName: string): string {
        return `__cryptoOperationStatus:${algorithmName}`;
    }
}
