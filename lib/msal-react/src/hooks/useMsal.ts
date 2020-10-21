/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useContext } from "react";
import { MsalContext } from "../MsalContext";

export const useMsal = () => useContext(MsalContext);
