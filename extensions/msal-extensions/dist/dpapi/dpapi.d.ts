export interface DpapiBindings {
    protectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array, scope: string): Uint8Array;
    unprotectData(encryptData: Uint8Array, optionalEntropy: Uint8Array, scope: string): Uint8Array;
}
export declare var Dpapi: DpapiBindings;
export default Dpapi;
