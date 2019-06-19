import { KeyGenAlgorithm, HashAlgorithm, KeyFormat, getArrayBufferFromString, getStringFromArrayBuffer, isIE11, getJwkString } from './PopTokenCommon';

/**
 * Thin wrapper around browser Web Crypto APIs.
 * Docs: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
 *
 * Includes support for IE11 msCrypto methods.
 * Docs: https://msdn.microsoft.com/en-us/ie/dn904640(v=vs.94)
 */
export class BrowserCrypto {
    private _algorithmOptions: RsaHashedKeyGenParams;

    constructor(keyGenAlgorithm: KeyGenAlgorithm, hashAlgorithm: HashAlgorithm, modulusLength: number, publicExponent: Uint8Array) {
        this._algorithmOptions = {
            name: keyGenAlgorithm,
            hash: hashAlgorithm,
            modulusLength,
            publicExponent
        }
    }

    async sign(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        if (isIE11()) {
            return new Promise((resolve, reject) => {
                const signOperation = window['msCrypto'].subtle.sign(this._algorithmOptions, key, data);
                signOperation.addEventListener('complete', (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                    resolve(e.target.result);
                });
                signOperation.addEventListener('error', (error: any) => {
                    reject(error);
                });
            });
        }

        return window.crypto.subtle.sign(this._algorithmOptions, key, data);
    }

    async verify(key: CryptoKey, signature: ArrayBuffer, data: ArrayBuffer): Promise<boolean> {
        if (isIE11()) {
            return new Promise((resolve, reject) => {
                const verifySignatureOperation = window['msCrypto'].subtle.verify(this._algorithmOptions, key, signature, data);
                verifySignatureOperation.addEventListener('complete', (e: { target: { result: boolean | PromiseLike<boolean>; }; }) => {
                    resolve(e.target.result);
                });
                verifySignatureOperation.addEventListener('error', (error: any) => {
                    reject(error);
                });
            });
        }

        return window.crypto.subtle.verify(this._algorithmOptions, key, signature, data);
    }

    async generateKey(extractable: boolean, usages: Array<string>): Promise<CryptoKeyPair> {
        if (isIE11()) {
            return new Promise((resolve, reject) => {
                const generateKeyOperation = window['msCrypto'].subtle.generateKey(this._algorithmOptions, extractable, usages);
                generateKeyOperation.addEventListener('complete', (e: { target: { result: CryptoKeyPair | PromiseLike<CryptoKeyPair>; }; }) => {
                    resolve(e.target.result);
                });
                generateKeyOperation.addEventListener('error', (error: any) => {
                    reject(error);
                });
            });
        }

        return window.crypto.subtle.generateKey(this._algorithmOptions, extractable, usages);
    }

    async exportKey(key: CryptoKey, format: KeyFormat): Promise<JsonWebKey> {
        if (isIE11()) {
            return new Promise((resolve, reject) => {
                const exportKeyOperation = window['msCrypto'].subtle.exportKey(format, key);
                exportKeyOperation.addEventListener('complete', (e: { target: { result: ArrayBuffer; }; }) => {
                    const resultBuffer: ArrayBuffer = e.target.result;
                    const resultString = getStringFromArrayBuffer(resultBuffer)
                        .replace(/\r/g, '')
                        .replace(/\n/g, '')
                        .replace(/\t/g, '')
                        .split(' ').join('')
                        .replace("\u0000", '');

                    try {
                        resolve(JSON.parse(resultString));
                    } catch (e) {
                        reject(e);
                    }
                });
                exportKeyOperation.addEventListener('error', (error: any) => {
                    reject(error);
                })
            });
        }

        return window.crypto.subtle.exportKey(format, key);
    }

    async importKey(key: JsonWebKey, format: KeyFormat, extractable: boolean, usages: Array<string>): Promise<CryptoKey> {
        if (isIE11()) {
            const keyString = getJwkString(key);
            const keyBuffer = getArrayBufferFromString(keyString);

            return new Promise((resolve, reject) => {
                const importOperation = window['msCrypto'].subtle.importKey(format, keyBuffer, this._algorithmOptions, extractable, usages);
                importOperation.addEventListener('complete', (e: { target: { result: CryptoKey | PromiseLike<CryptoKey>; }; }) => {
                    resolve(e.target.result);
                });
                importOperation.addEventListener('error', (error: any) => {
                    reject(error);
                });
            });
        }

        return window.crypto.subtle.importKey(format, key, this._algorithmOptions, extractable, usages);
    }

    async digest(algo: HashAlgorithm, dataString: string): Promise<ArrayBuffer> {
        const data = getArrayBufferFromString(dataString);

        if (isIE11()) {
            return new Promise((resolve, reject) => {
                const digestOperation = window['msCrypto'].subtle.digest(algo, data);
                digestOperation.addEventListener('complete', (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                    resolve(e.target.result);
                });
                digestOperation.addEventListener('error', (error: any) => {
                    reject(error);
                });
            });
        }

        return window.crypto.subtle.digest(algo, data);
    }
}
