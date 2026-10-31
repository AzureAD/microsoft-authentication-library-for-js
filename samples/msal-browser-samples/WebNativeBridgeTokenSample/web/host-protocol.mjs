const methods = new Set(["GetInitContext", "GetToken", "GetTokenPopup"]);

export function createHostProtocol({ validateRequest, execute, getInitContext, timeoutMs, maxConcurrent, mapError }) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647 || !Number.isInteger(maxConcurrent) || maxConcurrent < 1) throw new TypeError("Invalid bridge configuration");
    const pending = new Map();
    const completed = new Set();
    let active = 0;
    let disposed = false;
    const retire = requestId => {
        completed.add(requestId);
        if (completed.size > 1024) completed.delete(completed.values().next().value);
    };

    return {
        async handle(payload) {
            let requestId;
            let registered = false;
            let timer;
            try {
                if (typeof payload !== "string" || payload.length > 1_048_576) throw new Error("invalid_request");
                const candidate = JSON.parse(payload);
                if (!candidate || Array.isArray(candidate) || candidate.messageType !== "NestedAppAuthRequest" ||
                    typeof candidate.requestId !== "string" || !/^[\w-]{1,128}$/.test(candidate.requestId) || !methods.has(candidate.method)) throw new Error("invalid_request");
                requestId = candidate.requestId;
                const request = validateRequest(payload);
                if (disposed) throw new Error("bridge_disposed");
                if (pending.has(requestId) || completed.has(requestId)) throw new Error("duplicate_request");
                if (request.method === "GetInitContext") {
                    retire(requestId);
                    return { messageType: "NestedAppAuthResponse", requestId, success: true, initContext: getInitContext() };
                }
                if (active >= maxConcurrent) throw new Error("bridge_busy");
                const controller = new AbortController();
                pending.set(requestId, controller);
                active++;
                registered = true;
                const cancelled = new Promise((resolve, reject) => {
                    controller.signal.addEventListener("abort", () => reject(controller.signal.reason), { once: true });
                });
                timer = setTimeout(() => controller.abort(new Error("bridge_timeout")), timeoutMs);
                const execution = Promise.resolve().then(() => {
                    if (controller.signal.aborted) throw controller.signal.reason;
                    return execute(request, { signal: controller.signal });
                }).finally(() => {
                    active--;
                    pending.delete(requestId);
                });
                const result = await Promise.race([execution, cancelled]);
                if (controller.signal.aborted) throw controller.signal.reason;
                if (!result || typeof result !== "object" || Array.isArray(result) || result.error) throw new Error("invalid_request");
                return { ...result, messageType: "NestedAppAuthResponse", requestId, success: true };
            } catch (error) {
                if (requestId === undefined) return undefined;
                return { messageType: "NestedAppAuthResponse", requestId, success: false, error: mapError(error) };
            } finally {
                clearTimeout(timer);
                if (registered) retire(requestId);
            }
        },
        cancel(requestId) { pending.get(requestId)?.abort(new Error("bridge_cancelled")); },
        dispose() {
            if (disposed) return;
            disposed = true;
            for (const controller of pending.values()) controller.abort(new Error("bridge_disposed"));
        },
    };
}