namespace MSAL {
    export class Constants {
        static get errorDescription(): string { return "error_description"; }
        static get idToken(): string { return "id_token"; }
        static get accessToken(): string { return "access_token"; }
        static get expiresIn(): string { return "expires_in"; }
        static get sessionState(): string { return "session_state"; }
        static get tokenKeys(): string { return "adal.token.keys"; }
        static get accessTokenKey(): string { return "adal.access.token.key"; }
        static get expirationKey(): string { return "adal.expiration.key"; }
        static get stateLogin(): string { return "adal.state.login"; }
        static get stateAcquireToken(): string { return "adal.state.acquireToken"; }
        static get stateRenew(): string { return "adal.state.renew"; }
        static get nonceIdToken(): string { return "adal.nonce.idtoken"; }
        static get userName(): string { return "adal.username"; }
        static get idTokenKey(): string { return "adal.idtoken"; }
        static get error(): string { return "adal.error"; }
        static get loginRequest(): string { return "adal.login.request"; }
        static get loginError(): string { return "adal.login.error"; }
        static get renewStatus(): string { return "adal.token.renew.status"; }
        static get resourceDelimeter(): string { return "|"; }
        private static _loadFrameTimeout: number = 6000;
        static get loadFrameTimeout(): number {
            return this._loadFrameTimeout;
        };
        static set loadFrameTimeout(timeout: number) {
            this._loadFrameTimeout = timeout;
        };
        static get tokenRenewStatusCancelled(): string { return "Canceled"; }
        static get tokenRenewStatusCompleted(): string { return "Completed"; }
        static get tokenRenewStatusInProgress(): string { return "In Progress"; }
        private static _popUpWidth: number = 483;
        static get popUpWidth(): number { return this._popUpWidth; }
        static set popUpWidth(width: number) {
            this._popUpWidth = width;
        };
        private static _popUpHeight: number = 600;
        static get popUpHeight(): number { return this._popUpHeight; }
        static set popUpHeight(height: number) {
            this._popUpHeight = height;
        };
        static get login(): string { return "LOGIN"; }
        static get renewToken(): string { return "renewToken"; }
        static get unknown(): string { return "UNKNOWN"; }
    }
}