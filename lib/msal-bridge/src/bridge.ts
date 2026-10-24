import {
    NestedAppAuthBridge,
    NestedAppAuthMessageListener,
    NestedAppAuthTransport,
} from "./types.js";

const DEFAULT_MAX_MESSAGE_LENGTH = 1024 * 1024;

/** @internal */
export const disposedBridges = new WeakSet<NestedAppAuthBridge>();

function serializeMessage(message: unknown): string {
    if (typeof message === "string") {
        return message;
    }

    const serialized = JSON.stringify(message);
    if (serialized === undefined) {
        throw new TypeError(
            "Nested App Authentication message is not serializable."
        );
    }
    return serialized;
}

/** Default transport-independent Nested App Authentication bridge. @public */
export class DefaultNestedAppAuthBridge implements NestedAppAuthBridge {
    readonly host;
    private readonly listeners = new Set<NestedAppAuthMessageListener>();
    private readonly maxMessageLength: number;
    private disposed = false;

    constructor(
        private readonly transport: NestedAppAuthTransport,
        maxMessageLength: number = DEFAULT_MAX_MESSAGE_LENGTH
    ) {
        if (!Number.isSafeInteger(maxMessageLength) || maxMessageLength <= 0) {
            throw new RangeError(
                "maxMessageLength must be a positive integer."
            );
        }
        this.host = transport.host;
        this.maxMessageLength = maxMessageLength;
        this.transport.start((message: unknown) => this.__dispatch(message));
    }

    postMessage(message: string): void {
        this.assertActive();
        this.assertMessageLength(message);
        this.transport.postMessage(message);
    }

    addEventListener(
        name: "message",
        callback: NestedAppAuthMessageListener
    ): void {
        this.assertActive();
        if (name === "message" && typeof callback === "function") {
            this.listeners.add(callback);
        }
    }

    removeEventListener(
        name: "message",
        callback: NestedAppAuthMessageListener
    ): void {
        if (name === "message") {
            this.listeners.delete(callback);
        }
    }

    __dispatch(message: unknown): void {
        this.assertActive();
        const serialized = serializeMessage(message);
        this.assertMessageLength(serialized);
        Array.from(this.listeners).forEach((listener) => {
            try {
                listener({ data: serialized });
            } catch {}
        });
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        disposedBridges.add(this);
        this.listeners.clear();
        this.transport.dispose();
    }

    private assertActive(): void {
        if (this.disposed) {
            throw new Error("Nested App Authentication bridge is disposed.");
        }
    }

    private assertMessageLength(message: string): void {
        if (message.length > this.maxMessageLength) {
            throw new RangeError(
                `Nested App Authentication message exceeds ${this.maxMessageLength} characters.`
            );
        }
    }
}
