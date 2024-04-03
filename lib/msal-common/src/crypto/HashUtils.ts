/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Hash } from "../utils/Constants.js";
import crypto from "crypto";

export class HashUtils {
    /**
     * generate 'SHA256' hash
     * @param buffer
     */
    sha256(buffer: string): Buffer {
        return crypto.createHash(Hash.SHA256).update(buffer).digest();
    }

    /**
     * generate 'SHA256' hash as a base64 string
     * @param buffer
     */
    sha256Base64(buffer: string): string {
        return crypto.createHash(Hash.SHA256).update(buffer).digest("base64");
    }
}
