/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { version } from "../../package.json";
import { Header } from "utils/Constants";

/**
 * Utils for getting MSAL Node header values
 */
export class HeaderUtils {

    //TODO send in configuration of client application
    protected getMsalNodeDefaultHeaders(): Map<string, string>{

        return new Map<string, string>([
            [Header.MSAL_SKU_KEY, Header.MSAL_SKU_VALUE],
            [Header.MSAL_VERSION,  version ? version : ""],
            [Header.CPU, process.platform ? process.platform : ""],
            [Header.OS, process.arch ? process.arch : ""]
        ]);
    }
}
