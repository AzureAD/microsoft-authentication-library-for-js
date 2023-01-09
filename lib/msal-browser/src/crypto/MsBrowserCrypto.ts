/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "@azure/msal-common";
import { KEY_FORMAT_JWK } from "../utils/BrowserConstants";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { ISubtleCrypto } from "./ISubtleCrypto";

export class MsBrowserCrypto implements ISubtleCrypto {
    getRandomValues(dataBuffer: Uint8Array): Uint8Array {
        return window["msCrypto"].getRandomValues(dataBuffer);
    }

    async generateKey(algorithm: RsaHashedKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair> {
        return new Promise((resolve: Function, reject: Function) => {
            const msGenerateKey = window["msCrypto"].subtle.generateKey(algorithm, extractable, keyUsages);
            msGenerateKey.addEventListener("complete", (e: { target: { result: CryptoKeyPair | PromiseLike<CryptoKeyPair>; }; }) => {
                resolve(e.target.result);
            });

            msGenerateKey.addEventListener("error", (error: string) => {
                reject(error);
            });
        });
    }

    async exportKey(key: CryptoKey): Promise<JsonWebKey> {
        return new Promise((resolve: Function, reject: Function) => {
            const msExportKey = window["msCrypto"].subtle.exportKey(KEY_FORMAT_JWK, key);
            msExportKey.addEventListener("complete", (e: { target: { result: ArrayBuffer; }; }) => {
                const resultBuffer: ArrayBuffer = e.target.result;

                const resultString = BrowserStringUtils.utf8ArrToString(new Uint8Array(resultBuffer))
                    .replace(/\r/g, Constants.EMPTY_STRING)
                    .replace(/\n/g, Constants.EMPTY_STRING)
                    .replace(/\t/g, Constants.EMPTY_STRING)
                    .split(" ").join(Constants.EMPTY_STRING)
                    .replace("\u0000", Constants.EMPTY_STRING);

                try {
                    resolve(JSON.parse(resultString));
                } catch (e) {
                    reject(e);
                }
            });

            msExportKey.addEventListener("error", (error: string) => {
                reject(error);
            });
        });
    }

    async importKey(keyData: JsonWebKey, algorithm: RsaHashedImportParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey> {
        const keyString = BrowserStringUtils.getSortedObjectString(keyData);
        const keyBuffer = BrowserStringUtils.stringToArrayBuffer(keyString);

        return new Promise((resolve: Function, reject: Function) => {
            const msImportKey = window["msCrypto"].subtle.importKey(KEY_FORMAT_JWK, keyBuffer, algorithm, extractable, keyUsages);
            msImportKey.addEventListener("complete", (e: { target: { result: CryptoKey | PromiseLike<CryptoKey>; }; }) => {
                resolve(e.target.result);
            });

            msImportKey.addEventListener("error", (error: string) => {
                reject(error);
            });
        });
    }

    async sign(algorithm: AlgorithmIdentifier, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return new Promise((resolve: Function, reject: Function) => {
            const msSign = window["msCrypto"].subtle.sign(algorithm, key, data);
            msSign.addEventListener("complete", (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                resolve(e.target.result);
            });

            msSign.addEventListener("error", (error: string) => {
                reject(error);
            });
        });
    }
    
    async digest(algorithm: AlgorithmIdentifier, data: Uint8Array): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const digestOperation = window["msCrypto"].subtle.digest(algorithm, data.buffer);
            digestOperation.addEventListener("complete", (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                resolve(e.target.result);
            });
            digestOperation.addEventListener("error", (error: string) => {
                reject(error);
            });
        });
    }
}
