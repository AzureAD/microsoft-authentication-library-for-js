/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import crypto from "crypto";

export class CryptoKeys {
    private _thumbprint: string;
    public get thumbprint(): string {
        return this._thumbprint;
    }

    private _privateKey: string;
    public get privateKey(): string {
        return this._privateKey;
    }

    constructor() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });

        this._privateKey = privateKey;

        this._thumbprint = crypto
            .createHash("sha512")
            .update(publicKey)
            .digest("hex");
    }
}
