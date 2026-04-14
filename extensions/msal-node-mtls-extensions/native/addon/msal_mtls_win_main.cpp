/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * msal_mtls_win_main.cpp
 * N-API addon entry point for msal-node-mtls-extensions Phase 2.
 *
 * Exports (Windows only):
 *   createOrOpenKey(keyName, forceKeyGuard) -> { handle, level, isVbsProtected }
 *   closeKey(handle)
 *   getPublicKeyDer(handle) -> Buffer (DER-encoded SubjectPublicKeyInfo)
 *   signHashPss(handle, hashBuffer) -> Buffer (RSASSA-PSS SHA-256 signature)
 *   getAttestationToken(handle, nonce) -> string (MAA JWT)
 *   makeMtlsRequest(opts) -> Promise<{ status, headers, body }>
 *
 * Non-Windows: all exports throw "not supported on this platform".
 */

#include <napi.h>

#ifdef _WIN32
#include "cng_key.h"
#include "attestation.h"
#include "winhttp_mtls.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    CngKey::Init(env, exports);
    Attestation::Init(env, exports);
    WinHttpMtls::Init(env, exports);
    return exports;
}
#else
#include "not_supported.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    NotSupported::Init(env, exports);
    return exports;
}
#endif

NODE_API_MODULE(msal_mtls_win, Init)
