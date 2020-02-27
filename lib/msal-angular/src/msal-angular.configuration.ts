export type MsalAngularConfiguration = {
    consentScopes?: Array<string>;
    popUp?: boolean;
    extraQueryParameters?: {[key: string]: string};
    unprotectedResources?: string[];
    protectedResourceMap?: [string, string[]][] | Map<string, Array<string>>
};

export const defaultMsalAngularConfiguration : MsalAngularConfiguration = {
    consentScopes: [],
    popUp: false,
    extraQueryParameters: {},
    unprotectedResources: [],
    protectedResourceMap: []
};
