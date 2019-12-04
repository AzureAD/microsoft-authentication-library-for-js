/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICrypto, PKCECodes } from "msal-common";
import { GuidGenerator } from "../GuidGenerator";
import { Base64Encode } from "../Base64Encode";
import { Base64Decode } from "../Base64Decode";
import { PkceGenerator } from "../PkceGenerator";

export class BrowserCrypto implements ICrypto {

    private b64Encode: Base64Encode = new Base64Encode();
    private b64Decode: Base64Decode = new Base64Decode();
    private pkceGenerator: PkceGenerator = new PkceGenerator();

    /**
     * Creates a new random GUID - used to populate state?
     * @returns string (GUID)
     */
    createNewGuid(): string {
        return GuidGenerator.generateGuid();
    }

    base64Encode(input: string): string {
        return this.b64Encode.encode(input);
    }    
    
    base64Decode(input: string): string {
        return this.b64Decode.decode(input);
    }

    async generatePKCECodes(): Promise<PKCECodes> {
        return this.pkceGenerator.generateCodes();
    }
}
