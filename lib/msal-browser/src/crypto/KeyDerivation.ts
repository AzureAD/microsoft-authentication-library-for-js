/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { KeyDerivationError } from "../error/KeyDerivationError";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";

/*
 * Key Derivation using Pseudorandom Functions in Counter Mode: SP 800-108
 * Spec link: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-108.pdf
 * 
 * Pseudocode:
 * 
 * Fixed values:
 * 1. h - The length of the output of the PRF (Pseudorandom Function) in bits
 * 2. r - The length of the binary representation of the counter i.
 * Input: KI, Label, Context, and L.
 * Process:
 * 1. n := ⎡L/h⎤.
 * 2. If n > 2^r -1, then indicate an error and stop.
 * 3. result(0):= ∅.
 * 4. For i = 1 to n, do
 *  a. K(i) := PRF (KI, [i]2 || Label || 0x00 || Context || [L]2)
 *  b. result(i) := result(i-1) || K(i).
 * 5. Return: KO := the leftmost L bits of result(n).
 * Output: KO.
 */

export class KeyDerivation {
    // L: The length in bits of the KDF output (resulting key size)
    private derivedKeyLengthInBits: number;
    // h: The length int bits of the PRF (HMAC) output (size of output of a single iteration of the PRF)
    private prfOutputLengthInBits: number;
    // r - The length in bits of the binary representation of the counter i.
    private counterLengthInBits: number;
    // n := ⎡L/h⎤ (how many iterations of the PRF are necessary to generate a key of size L)
    private iterationsRequired: number;

    constructor(keyLength: number, prfOutputLength: number, counterLength: number) {
        this.derivedKeyLengthInBits = keyLength;
        this.prfOutputLengthInBits = prfOutputLength;
        this.counterLengthInBits = counterLength;
        this.iterationsRequired = this.calculateRequiredIterations();
    }

    /**
     * Key Derivation using Pseudorandom Functions in Counter Mode: SP 800-108
     * Spec link: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-108.pdf 
     * @param derivationKey 
     * @param ctx 
     * @param label 
     */
    public async computeKDFInCounterMode(derivationKey: CryptoKey, ctx: string, label: string): Promise<ArrayBuffer> {
        const fixedInput = this.generateFixedInput(ctx, label);
        const keyLengthInBytes = this.derivedKeyLengthInBits / 8;
        const offset = keyLengthInBytes / this.iterationsRequired;
        const result = new Uint8Array(keyLengthInBytes);
        let counter = new Uint8Array([0, 0, 0, 1]);

        for (let i = 1; i <= this.iterationsRequired; i = i + 1) {
            const iterationResult = await this.kdfInCounterMode(derivationKey, counter, fixedInput);
            const currentOffset = (i - 1) * offset;
            result.set(iterationResult, currentOffset);
            counter = this.incrementCounter(counter);
        }

        return result;
    }

    /**
     * Pre-pends counter bytes to fixed input data binary string (byte array)
     * and calculates the input data's HMAC using SHA-256 hashing algorithm.
     * This function executes the PRF step of a single iteration of the 
     * SP800-108 Key Derivation Function in Counter Mode.
     * @param derivationKey
     * @param counter 
     * @param fixedInput 
     */
    private async kdfInCounterMode(derivationKey: CryptoKey, counter: Uint8Array, fixedInput: Uint8Array): Promise<Uint8Array> {
        // Hash input data size: counter bytes + label bytes + 1 byte (0x00) + ctx bytes + key length bytes
        const data = new Uint8Array(counter.length + fixedInput.length);
        // Concatenate [i]_2 || fixed input
        data.set(counter, 0); // [i]_2 (counter)
        data.set(fixedInput, counter.length);
        // Run PRF (HMAC-SHA-256) over input with Content Encryption Key as signing key
        const resultBuffer = await window.crypto.subtle.sign("HMAC", derivationKey, data); // PRF execution
        return new Uint8Array(resultBuffer);
    }

    /**
     * Calculates how many iterations are required to generate
     * the required key bits.
     * 1. n := ⎡L/h⎤.
     * 2. If n > 2^r -1, then indicate an error and stop.
     */
    private calculateRequiredIterations(): number {
        const iterationsRequired = Math.ceil(this.derivedKeyLengthInBits / this.prfOutputLengthInBits);

        if (this.iterationsRequired > (Math.pow(2, this.counterLengthInBits) - 1)) {
            throw KeyDerivationError.createiterationsRequiredErrorError(iterationsRequired, this.counterLengthInBits);
        }

        return iterationsRequired;
    }

    /**
     * Encodes the derivation context and label strings into byte arrays and returns
     * the fixed segment of the structured input for the SP800-108 Key Derivation in Counter Mode
     * algorithm's pseudo-random function.
     * Returned binary string is in the form Label || 0x00 || ctx || [L]_2
     * @param ctx 
     * @param label 
     */
    private generateFixedInput(ctx: string, label: string): Uint8Array {
        // Encode context
        const ctxBytes = Uint8Array.from(window.atob(ctx), (v) => v.charCodeAt(0));
        // Encode label
        const labelBytes = BrowserStringUtils.stringToUtf8Arr(label);
        // Generate Zero Octet (0x00)
        const zeroOctet = new Uint8Array([0]);
        /**
         * Length size Disambiguation:
         * [L]_2 ByteArray representation of key length (256 bits)
         * Rightmost byte: n * 2^0 => 1 * 2^0 = 1
         * Second to rightmost byte: n * 2^8 => 1 * 2^8 = 256 
         * Hence [0, 0, 1, 0] = 256
         */
        const keyLengthBytes = new Uint8Array([0, 0, 1, 0]); 

        // Total length of  [Label || 0x00 || ctx || [L]_2]
        const fixedInput = new Uint8Array(labelBytes.length + zeroOctet.length + ctxBytes.length + keyLengthBytes.length);

        // Concatenate [Label || 0x00 || ctx || [L]_2]
        fixedInput.set(labelBytes, 0); // Label
        fixedInput.set([0], labelBytes.length); // 0x00
        fixedInput.set(ctxBytes, labelBytes.length + zeroOctet.length); // ctx
        fixedInput.set(keyLengthBytes, fixedInput.length - keyLengthBytes.length); // [L]_2 (key length)

        return fixedInput; 
    }

    /**
     * Increments the counter byte array by 1 bit.
     * Doesn't account for overflow given that counter size
     * should not even approach 2^8, so only least significant byte
     * will ever be incremented.
     * @param counter 
     * @returns 
     */
    private incrementCounter(counter: Uint8Array): Uint8Array {
        // Increment least significant byte
        counter[3] = counter[3] + 1;
        return counter;
    }
}
