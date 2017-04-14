namespace MSAL {

    let ResponseTypes = {
        id_token: 'id_token',
        token: "token",
        id_tokenToken: 'id_token token'
    };

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
        extraQueryParameters: Array<string>;
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
            this.correlationId = Utils.CreateNewGuid();
            this.state = Utils.CreateNewGuid();
            this.nonce = Utils.CreateNewGuid();
            // telemetry information
            this.xClientSku = "Js";
            this.xClientVer = Utils.GetLibraryVersion();
        }

        CreateNavigateUrl(scopes: Array<string>): string {
            if (!scopes) {
                scopes = [this.clientId];
            }
            if (scopes.indexOf(this.clientId) == -1) {
                scopes.push(this.clientId);
            }
            let requestUrl = "";
            let str: Array<string> = [];
            str.push('?response_type=' + this.responseType);
            this.translateclientIdUsedInScope(scopes);
            str.push('scope=' + encodeURIComponent(this.parseScope(scopes)));
            str.push('client_id=' + encodeURIComponent(this.clientId));
            str.push('redirect_uri=' + encodeURIComponent(this.redirectUri));
            str.push('state=' + encodeURIComponent(this.state));
            str.push('nonce=' + encodeURIComponent(this.nonce));
            str.push('client_info=1');
            if (this.extraQueryParameters) {
                for (let i = 0; i < this.extraQueryParameters.length; i++) {
                    str.push(this.extraQueryParameters[i]);
                }
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