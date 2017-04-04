namespace MSAL {
    export interface MSALWindow extends Window {
        MSAL: Object,
        callBackMappedToRenewStates: Object;
        callBacksMappedToRenewStates: Object;
    }
}