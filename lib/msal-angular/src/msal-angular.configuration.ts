export type MsalAngularConfiguration = {
    consentScopes?: Array<string>;
    popUp?: boolean;
    extraQueryParameters?: {[key: string]: string};
}

export const defaultMsalAngularConfiguration : MsalAngularConfiguration = {
    consentScopes: [],
    popUp: false,
    extraQueryParameters: {}
}
