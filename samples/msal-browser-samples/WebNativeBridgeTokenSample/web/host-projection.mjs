import { createHostProtocol } from "./host-protocol.mjs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = new Set(["clientId", "scope", "authority", "correlationId", "authenticationScheme", "forceRefresh", "platformBrokerId", "extraParameters", "claims"]);
const codes = new Set(["cancelled", "account_changed", "account_unavailable", "invalid_token_result", "bridge_timeout", "bridge_busy", "duplicate_request", "invalid_request", "bridge_cancelled", "registration_not_confirmed"]);

function errorEnvelope(error) {
    const original = error?.errorCode || error?.message;
    let status = "PERSISTENT_ERROR";
    let code = codes.has(original) ? original : "executor_failed";
    if (["interaction_required", "login_required", "consent_required"].includes(original) || error?.name === "InteractionRequiredAuthError") { status = "USER_INTERACTION_REQUIRED"; code = "interaction_required"; }
    if (["user_cancelled", "user_canceled"].includes(original)) { status = "USER_CANCEL"; code = "user_cancelled"; }
    if (original === "account_unavailable") status = "ACCOUNT_UNAVAILABLE";
    if (["no_network_connectivity", "network_error"].includes(original)) { status = "NO_NETWORK"; code = "network_error"; }
    return { status, code, description: code };
}

function parse(payload, child) {
    if (typeof payload !== "string" || payload.length > 1_048_576) throw new Error("invalid_request");
    const request = JSON.parse(payload, (key, value) => {
        if (["__proto__", "prototype", "constructor"].includes(key)) throw new Error("invalid_request");
        return value;
    });
    if (!request || request.messageType !== "NestedAppAuthRequest" || typeof request.requestId !== "string" || !/^[\w-]{1,128}$/.test(request.requestId) ||
        !["GetInitContext", "GetToken", "GetTokenPopup"].includes(request.method) || Object.keys(request).some(key => !["messageType", "requestId", "method", "tokenParams", "sendTime", "clientLibrary", "clientLibraryVersion"].includes(key)) ||
        (request.sendTime !== undefined && !Number.isFinite(request.sendTime)) ||
        [request.clientLibrary, request.clientLibraryVersion].some(value => value !== undefined && (typeof value !== "string" || value.length > 128))) throw new Error("invalid_request");
    if (request.method === "GetInitContext") return request;
    const params = request.tokenParams;
    if (!params || Array.isArray(params) || Object.keys(params).some(key => !fields.has(key)) || params.clientId !== child.clientId ||
        (params.extraParameters !== undefined && (!params.extraParameters || Array.isArray(params.extraParameters) || typeof params.extraParameters !== "object" || Object.keys(params.extraParameters).length !== 0)) ||
        (params.authority && params.authority.replace(/\/$/, "") !== child.authority.replace(/\/$/, "")) ||
        (params.authenticationScheme && params.authenticationScheme.toLowerCase() !== "bearer") ||
        (params.forceRefresh !== undefined && typeof params.forceRefresh !== "boolean") ||
        (params.correlationId && !uuid.test(params.correlationId)) || typeof params.scope !== "string" || params.scope.length > 4096) throw new Error("invalid_request");
    const scopes = params.scope.split(" ").filter(Boolean);
    if (params.claims !== undefined) {
        if (typeof params.claims !== "string" || params.claims.length > 1024) throw new Error("invalid_request");
        const claims = JSON.parse(params.claims);
        if (!claims || Object.keys(claims).some(key => key !== "id_token") || !claims.id_token ||
            Object.entries(claims.id_token).some(([key, value]) => !["signin_state", "login_hint", "tenant_region_sub_scope"].includes(key) || !value || Object.keys(value).length !== 1 || value.essential !== false)) throw new Error("invalid_request");
    }
    const allowed = new Set(child.scopes.map(scope => scope.toLowerCase()));
    if (!scopes.length || scopes.length > 32 || scopes.some(scope => !allowed.has(scope.toLowerCase()))) throw new Error("invalid_request");
    return { ...request, tokenParams: { scope: scopes.join(" "), correlationId: params.correlationId || crypto.randomUUID() } };
}

export class HostProjection {
    constructor(executor, { getAccount = () => null, timeoutMs = 90000, maxConcurrent = 2, rateLimit = 30 } = {}) {
        this.executor = executor;
        this.getAccount = getAccount;
        this.timeoutMs = timeoutMs;
        this.maxConcurrent = maxConcurrent;
        this.rateLimit = rateLimit;
        this.frames = new Map();
        this.active = 0;
        this.disposed = false;
    }

    attach(frame, child) {
        if (this.disposed) return;
        const previous = this.frames.get(frame);
        previous?.protocol.dispose();
        const session = { frame, child, epoch: crypto.randomUUID(), nonce: null, times: [] };
        session.protocol = createHostProtocol({
            validateRequest: payload => {
                const request = parse(payload, child);
                const original = JSON.parse(payload).tokenParams;
                if (original?.platformBrokerId !== undefined && (typeof original.platformBrokerId !== "string" || original.platformBrokerId !== this.getAccount()?.homeAccountId)) throw new Error("invalid_request");
                session.times = session.times.filter(time => time > Date.now() - 10000);
                if (session.times.length >= this.rateLimit) throw new Error("bridge_busy");
                session.times.push(Date.now());
                return request;
            },
            execute: async (request, { signal }) => {
                if (this.active >= this.maxConcurrent) throw new Error("bridge_busy");
                this.active++;
                try { return await this.executor.execute({ ...request, child }, { signal }); }
                finally { this.active--; }
            },
            getInitContext: () => {
                const account = this.getAccount();
                return { sdkName: "WebNativeBridgeTokenSample", sdkVersion: "poc", capabilities: { queryAccount: false }, accountContext: account ? { homeAccountId: account.homeAccountId, environment: account.environment, tenantId: account.tenantId } : undefined };
            },
            timeoutMs: this.timeoutMs,
            maxConcurrent: this.maxConcurrent,
            mapError: errorEnvelope,
        });
        this.frames.set(frame, session);
        frame.contentWindow.postMessage({ channel: "web-native", kind: "challenge", epoch: session.epoch }, child.origin);
    }

    reset() {
        for (const { frame, child } of this.frames.values()) this.attach(frame, child);
    }

    dispose() {
        this.disposed = true;
        for (const session of this.frames.values()) session.protocol.dispose();
        this.frames.clear();
    }

    async receive(event) {
        if (this.disposed || !event.data || event.data.channel !== "web-native") return;
        const session = [...this.frames.values()].find(entry => entry.frame.contentWindow === event.source && entry.child.origin === event.origin);
        if (!session || event.data.epoch !== session.epoch) return;
        const { kind, nonce } = event.data;
        if (kind === "hello" && !session.nonce && typeof nonce === "string" && uuid.test(nonce)) {
            session.nonce = nonce;
            event.source.postMessage({ channel: "web-native", kind: "attached", epoch: session.epoch, nonce }, event.origin);
            return;
        }
        if (!session.nonce || nonce !== session.nonce) return;
        if (kind === "cancel") { session.protocol.cancel(event.data.requestId); return; }
        if (kind !== "request") return;
        const payload = await session.protocol.handle(event.data.payload);
        if (payload && !this.disposed && this.frames.get(session.frame) === session) event.source.postMessage({ channel: "web-native", kind: "response", epoch: session.epoch, nonce, payload }, event.origin);
    }
}