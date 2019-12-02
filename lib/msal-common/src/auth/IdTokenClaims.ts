/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type IdTokenClaims = {
    iss: string,
    oid: string,
    sub: string,
    tid: string,
    ver: string,
    preferred_username: string,
    name: string,
    nonce: string,
    exp: string,
    home_oid: string,
    sid: string,
    cloud_instance_host_name: string
};
