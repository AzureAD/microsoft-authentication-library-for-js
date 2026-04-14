/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * winhttp_mtls.h
 * WinHTTP-based mTLS HTTP client using a CNG-backed client certificate.
 */
#pragma once
#include <napi.h>

namespace WinHttpMtls {
    void Init(Napi::Env env, Napi::Object exports);
}
