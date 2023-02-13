import { IAuthBridge } from "@azure/msal-browser";
import { AuthBridgeErrorCodes } from "@azure/msal-browser";
import { ResponseMessage } from "@azure/msal-browser";
import { RequestMessage } from "@azure/msal-browser";
import { AuthBridgeEventHandler } from "@azure/msal-browser";

declare global { interface Window { chrome: { webview: { postMessage: (message: any) => void; addEventListener: (type: string, handler: any, message: any) => void;}; }; } }
declare global { interface Window { authBridge: IAuthBridge } }

/**
 * Mock authentication channel implementation
 * In broker scenarios, this is "injected" by the host. Applications will not have to write it
 */
export class MockAuthenticationChannel implements IAuthBridge {
    private messageMap: Map<string, Callbacks>;

    private constructor() {
        this.messageMap = new Map<string, Callbacks>();
        this.AddEventListener();
    }

    static initialize(): void {
        if (window.chrome?.webview === null || window.chrome?.webview === undefined) {
            throw new Error("Unknown environment");
        }

        if (window.authBridge === undefined || window.authBridge === null){
            window.authBridge = new MockAuthenticationChannel();
        }
    }

    async postMessage<T1, T2>(payload: RequestMessage<T1>): Promise<ResponseMessage<T2>> {
        if (window.chrome?.webview !== null && window.chrome?.webview !== undefined) {
            return await this.sendMessageWebView2Async<T1, T2>(payload);
        }

        throw new Error("Unknown environment");
    }

    addEventListener<T>(eventType: string, listener: AuthBridgeEventHandler<T>): void {
        throw new Error("Method not implemented");
    }

    removeEventListener(eventType: string): void {
        throw new Error("Method not implemented");
    }

    private async sendMessageWebView2Async<T1, T2>(request: RequestMessage<T1>): Promise<ResponseMessage<T2>> {
        window.chrome.webview.postMessage(JSON.stringify(request));
        return new Promise<ResponseMessage<T2>>((resolve, reject) => this.messageMap.set(request.id, { resolve: resolve, reject: reject }));
    }

    private AddEventListener(): void {
        const eventHandler =
            (event: Event) => {
                const postEvent = event as MessageEvent<ResponseMessage<any>>;

                if (postEvent !== null && postEvent !== undefined) {
                    let callbacks: Callbacks | undefined;
                    if (postEvent.data?.id !== null && (callbacks = this.messageMap.get(postEvent.data?.id as string)) !== undefined) {
                        this.messageMap.delete(postEvent.data?.id as string);
                        if (postEvent.data?.errorCode === AuthBridgeErrorCodes.Success) {
                            callbacks.resolve(postEvent.data);
                        }
                        else {
                            callbacks.reject(postEvent.data.payload);
                        }
                    }
                }
            };

        window.chrome.webview.addEventListener("message", eventHandler, { once: false });
    }
}

type Callbacks = {
    resolve: any,
    reject: any
}
