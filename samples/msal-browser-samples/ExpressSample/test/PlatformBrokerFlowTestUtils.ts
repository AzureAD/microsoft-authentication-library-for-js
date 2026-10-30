import * as puppeteer from "puppeteer";
import {
    AuthenticationResult,
    EventType,
    InteractionType,
    IPublicClientApplication,
} from "@azure/msal-browser";

type AuthModule = { msalInstance: IPublicClientApplication };
type BrokerResult = {
    fromPlatformBroker: boolean | undefined;
    fromCache: boolean;
    homeAccountId: string;
    nativeAccountId: string | undefined;
};

function verifyBrokerResult(
    result: BrokerResult | null,
    interactionType: InteractionType
): BrokerResult {
    expect(result).not.toBeNull();
    if (!result) {
        throw new Error("The requested MSAL operation did not return a result");
    }
    expect(result.nativeAccountId).toBeTruthy();
    expect(result.homeAccountId).toBeTruthy();
    if (interactionType === InteractionType.Silent) {
        expect(result.fromPlatformBroker || result.fromCache).toBe(true);
    } else {
        expect(result.fromPlatformBroker).toBe(true);
    }
    return result;
}

export async function verifyPlatformBrokerRedirect(
    page: puppeteer.Page
): Promise<BrokerResult> {
    // Keep native import() in the browser rather than transpiling it to require().
    const auth = await page.evaluateHandle<[], () => Promise<AuthModule>>(
        "import('/js/auth.js')"
    );
    try {
        const result = await auth.evaluate((module: AuthModule) =>
            module.msalInstance.handleRedirectPromise().then((response) =>
                response
                    ? {
                          fromPlatformBroker: response.fromPlatformBroker,
                          fromCache: response.fromCache,
                          homeAccountId: response.account.homeAccountId,
                          nativeAccountId: response.account.nativeAccountId,
                      }
                    : null
            )
        );
        return verifyBrokerResult(result, InteractionType.Redirect);
    } finally {
        await auth.dispose();
    }
}

export async function verifyPlatformBrokerOperation(
    page: puppeteer.Page,
    interactionType: InteractionType,
    action: () => Promise<void>
): Promise<BrokerResult> {
    const auth = await page.evaluateHandle<[], () => Promise<AuthModule>>(
        "import('/js/auth.js')"
    );
    let observation:
        | puppeteer.JSHandle<{
              result: BrokerResult | null;
              callbackId: string | null;
          }>
        | undefined;
    try {
        observation = await auth.evaluateHandle(
            (module: AuthModule, eventType, interaction) => {
                const state: {
                    result: BrokerResult | null;
                    callbackId: string | null;
                } = { result: null, callbackId: null };
                state.callbackId = module.msalInstance.addEventCallback(
                    (message) => {
                        if (
                            message.eventType === eventType &&
                            message.interactionType === interaction &&
                            message.payload &&
                            "accessToken" in message.payload &&
                            !state.result
                        ) {
                            const response: AuthenticationResult =
                                message.payload;
                            state.result = {
                                fromPlatformBroker: response.fromPlatformBroker,
                                fromCache: response.fromCache,
                                homeAccountId: response.account.homeAccountId,
                                nativeAccountId:
                                    response.account.nativeAccountId,
                            };
                        }
                    }
                );
                if (!state.callbackId) {
                    throw new Error(
                        "MSAL result observation could not be installed"
                    );
                }
                return state;
            },
            EventType.ACQUIRE_TOKEN_SUCCESS,
            interactionType
        );
        await action();
        return verifyBrokerResult(
            await observation.evaluate((state) => state.result),
            interactionType
        );
    } finally {
        try {
            if (observation) {
                await auth.evaluate((module: AuthModule, state) => {
                    if (state.callbackId) {
                        module.msalInstance.removeEventCallback(
                            state.callbackId
                        );
                    }
                }, observation);
            }
        } finally {
            await observation?.dispose();
            await auth.dispose();
        }
    }
}

export async function observePopupEarRequests(
    page: puppeteer.Page,
    action: () => Promise<void>
): Promise<number> {
    const opener = await page.createCDPSession();
    const { targetInfo: openerInfo } = await opener.send(
        "Target.getTargetInfo"
    );
    await opener.detach();
    const root = await page.browser().target().createCDPSession();
    const sessions = new Set<puppeteer.CDPSession>();
    const pending: Promise<void>[] = [];
    let requestCount = 0;
    let failObservation!: (error: unknown) => void;
    const failure = new Promise<never>((_resolve, reject) => {
        failObservation = reject;
    });
    const onAttached = ({
        sessionId,
        targetInfo,
    }: puppeteer.Protocol.Target.AttachedToTargetEvent) => {
        const observe = async () => {
            const session = root.connection()?.session(sessionId);
            if (!session) {
                throw new Error(
                    "Auto-attached popup CDP session was not found"
                );
            }
            sessions.add(session);
            try {
                if (targetInfo.openerId === openerInfo.targetId) {
                    session.on("Network.requestWillBeSent", ({ request }) => {
                        if (
                            request.method === "POST" &&
                            new URL(request.url).pathname.endsWith("/authorize")
                        ) {
                            requestCount++;
                        }
                    });
                    await session.send("Network.enable", {
                        maxPostDataSize: 0,
                    });
                }
            } finally {
                await session.send("Runtime.runIfWaitingForDebugger");
            }
        };
        // Forward async listener failures to the test, not an unhandled rejection.
        pending.push(observe().catch(failObservation));
    };
    root.on("Target.attachedToTarget", onAttached);
    try {
        await Promise.race([
            root.send("Target.setAutoAttach", {
                autoAttach: true,
                waitForDebuggerOnStart: true,
                flatten: true,
                filter: [{ type: "page" }, { exclude: true }],
            }),
            failure,
        ]);
        await Promise.race([action(), failure]);
        await Promise.race([Promise.all(pending), failure]);
        return requestCount;
    } finally {
        try {
            await root.send("Target.setAutoAttach", {
                autoAttach: false,
                waitForDebuggerOnStart: false,
                flatten: true,
            });
            await Promise.race([Promise.all(pending), failure]);
        } finally {
            root.off("Target.attachedToTarget", onAttached);
            try {
                await Promise.all(
                    Array.from(sessions, async (session) => {
                        session.removeAllListeners("Network.requestWillBeSent");
                        if (!session.detached) {
                            await session.detach();
                        }
                    })
                );
            } finally {
                await root.detach();
            }
        }
    }
}
