/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IGuidGenerator } from "@azure/msal-common/node";
import { randomUUID } from "node:crypto";

export class GuidGenerator implements IGuidGenerator {
    /**
     * Generates a random [RFC 4122](https://www.rfc-editor.org/rfc/rfc4122.txt) version 4 UUID. The UUID is generated using a
     * cryptographic pseudorandom number generator.
     */
    generateGuid(): string {
        return randomUUID();
    }

    /**
     * verifies if a string is  GUID
     * @param guid
     */
    isGuid(guid: string): boolean {
        const regexGuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regexGuid.test(guid);
    }
}
