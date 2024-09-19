/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useContext } from "react";
import { IMsalContext, MsalContext } from "../MsalContext.js";

/**
 * Returns Msal Context values
 */
export const useMsal = (): IMsalContext => useContext(MsalContext);
