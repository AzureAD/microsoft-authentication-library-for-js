namespace MSAL {
    export class AuthenticationRequestParameters {
        authority: string;
        clientId: string;
        nonce: string;
        state: string;
        correlationId: string;
        xClientVer: string;
        xClientSku: string;
        scopes: Array<string>;
        responseType: string;
        promptValue: string;
        extraQueryParameters: string;
        loginHint: string;
        domainHint: string;
        redirectUri: string;

        constructor(authority: string, clientId: string, scope: Array<string>, responseType: string, redirectUri: string) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scope;
            this.responseType = responseType;
            this.redirectUri = redirectUri;
            // randomly generated values
            if (responseType !== "token") {
                this.nonce = Utils.Guid();
            }
            this.correlationId = Utils.Guid();
            this.state = Utils.Guid();
            this.nonce = Utils.Guid();
            // telemetry information
            this.xClientSku = "Js";
            this.xClientVer = Utils.GetLibraryVersion();
        }

        CreateNavigateUrl(scopes: Array<string>): string {
            if (!scopes)
                scopes = [this.clientId];
            let requestUrl = "";
            let str: Array<string> = [];
            str.push('?response_type=' + this.responseType);
            if (this.responseType === ResponseTypes[ResponseTypes.id_token]) {
                if (scopes.indexOf(this.clientId) > -1) {
                    this.translateclientIdUsedInScope(scopes);
                }
            }
            str.push('scope=' + encodeURIComponent(this.parseScope(scopes)));
            str.push('client_id=' + encodeURIComponent(this.clientId));
            str.push('redirect_uri=' + encodeURIComponent(this.redirectUri));
            str.push('state=' + encodeURIComponent(this.state));
            str.push('nonce=' + encodeURIComponent(this.nonce));
            if (this.extraQueryParameters) {
                str.push(this.extraQueryParameters);
            }
            str.push('client-request-id=' + encodeURIComponent(this.correlationId));
            requestUrl = this.authority + '/oauth2/v2.0/authorize' + str.join('&') + "&x-client-SKU=" + this.xClientSku + "&x-client-Ver=" + this.xClientVer;
            return requestUrl;
        }

        translateclientIdUsedInScope(scopes: Array<string>): void {
            var clientIdIndex = scopes.indexOf(this.clientId);
            if (clientIdIndex >= 0) {
                scopes.splice(clientIdIndex, 1);
                scopes.push('openid');
                scopes.push('profile');
            }
        }

        parseScope(scopes: Array<string>): string {
            var scopeList = '';
            if (scopes) {
                for (var i = 0; i < scopes.length; ++i) {
                    scopeList += (i !== scopes.length - 1) ? scopes[i] + ' ' : scopes[i];
                }
            }
            return scopeList;
        }
    }
}