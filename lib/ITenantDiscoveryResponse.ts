namespace MSAL {
    export interface ITenantDiscoveryResponse {
        AuthorizationEndpoint: string;
        EndSessionEndpoint: string;
        Issuer: string;
    }
}