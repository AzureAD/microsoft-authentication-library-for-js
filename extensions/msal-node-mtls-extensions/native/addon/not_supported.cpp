/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
#include "not_supported.h"

static Napi::Value NotSupportedFn(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Error::New(env, "msal-node-mtls-extensions is only supported on Windows (x64)").ThrowAsJavaScriptException();
    return env.Undefined();
}

void NotSupported::Init(Napi::Env env, Napi::Object exports) {
    const char* fns[] = { "createOrOpenKey", "closeKey", "getPublicKeyDer", "signHashPss",
                          "getAttestationToken", "makeMtlsRequest", nullptr };
    for (int i = 0; fns[i]; ++i)
        exports.Set(fns[i], Napi::Function::New(env, NotSupportedFn));
}
