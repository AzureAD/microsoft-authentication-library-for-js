namespace MSAL {
    export interface ITenantDiscoveryResponse {
        AuthorizationEndpoint: string;
        TokenEndpoint: string;
        Issuer: string;
    }
}