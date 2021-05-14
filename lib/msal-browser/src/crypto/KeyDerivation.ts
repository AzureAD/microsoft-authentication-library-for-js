/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserStringUtils } from "../utils/BrowserStringUtils";

/*
 * Key Derivation using Pseudorandom Functions in Counter Mode: SP 800-108
 * Spec link: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-108.pdf
 * Formula:
 * 
 * Fixed values:
 * 1. h - The length of the output of the PRF in bits
 * 2. r - The length of the binary representation of the counter i.
 * Input: KI, Label, Context, and L.
 * Process:
 * 1. n := ⎡L/h⎤.
 * 2. If n > 2^r -1, then indicate an error and stop.
 * 3. result(0):= ∅.
 * 4. For i = 1 to n, do
 * a. K(i) := PRF (KI, [i]2 || Label || 0x00 || Context || [L]2)
 * 12
 * SP 800-108 Recommendation for Key Derivation Using Pseudorandom Functions
 * b. result(i) := result(i-1) || K(i).
 * 5. Return: KO := the leftmost L bits of result(n).
 * Output: KO.
 * 
 * Implementation notes:
 * 1. PRF: we use HMAC-SHA256
 * h: 256
 * r: 32
 * L: 256
 * Label: AzureAD-SecureConversation
 * 
 * the input of HMAC-SHA256 would look like:
 * 0x00 0x00 0x00 0x01 || AzureAD-SecureConversation String in binary || 0x00 || context in binary || (256) in big-endian binary 
 */

export class KeyDerivation {
    private derivedKeyLengthInBits: number;
    private prfOutputLengthInBits: number;
    private counterLengthInBits: number;
    private iterationsRequired: number;
    private derivationKey: CryptoKey;

    constructor(derivationKey: CryptoKey, keyLength: number, prfOutputLength: number, counterLength: number) {
        this.derivationKey = derivationKey;
        this.derivedKeyLengthInBits = keyLength;
        this.prfOutputLengthInBits = prfOutputLength;
        this.counterLengthInBits = counterLength;
        this.iterationsRequired = this.calculateRequiredIterations();
    }

    private calculateRequiredIterations(): number {
        const iterationsRequired = Math.ceil(this.derivedKeyLengthInBits / this.prfOutputLengthInBits);

        if (this.iterationsRequired > (Math.pow(2, this.counterLengthInBits) - 1)) {
            throw new Error("Key Derivation Initialization Error: n was calculated to be greather than 2^r -1");
        }

        return iterationsRequired;
    }

    public async computeKDFInCounterMode(ctx: string, label: string): Promise<ArrayBuffer> {
        // Encode context
        const ctxBytes = Uint8Array.from(window.atob(ctx), (v) => v.charCodeAt(0));
        // Encode label
        const labelBytes = BrowserStringUtils.stringToUtf8Arr(label);
        // 4 byte counter + label bytes + 1 byte 0x00 + ctx bytes + 4 byte key length
        const data = new Uint8Array(4 + labelBytes.length + 1 + ctxBytes.length + 4);
        data.set([0, 0, 0, 1], 0); // [i]_2 (counter) = 1
        data.set(labelBytes, 4); // Label
        data.set([0], labelBytes.length + 4); // 0x00
        data.set(ctxBytes, labelBytes.length + 4 + 1); // ctx
        data.set([0, 0, 1, 0], data.length - 4); // [L]_2 (key length)

        return await this.kdfInCounterMode(data);
    }

    public async kdfInCounterMode(inputData: Uint8Array): Promise<ArrayBuffer> {
        return await window.crypto.subtle.sign("HMAC", this.derivationKey, inputData); // PRF
    }
}
