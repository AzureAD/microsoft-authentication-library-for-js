/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FlattenedJWSInput, JWSHeaderParameters, KeyLike } from "jose";

/**
 * GetKeyFunction type from JOSE GetKeyFunction interface:
 * https://github.com/panva/jose/blob/main/docs/interfaces/types.GetKeyFunction.md
 * 
 * Exporting own type because GetKeyFunction is not exported from JOSE
 */
export type GetKeyFunction = (T: JWSHeaderParameters, T2: FlattenedJWSInput) =>  Uint8Array | KeyLike | Promise<Uint8Array | KeyLike>;
