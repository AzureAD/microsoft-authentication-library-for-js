/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * not_supported.h / not_supported.cpp
 * Stub for non-Windows platforms.
 */
#pragma once
#include <napi.h>

namespace NotSupported {
    void Init(Napi::Env env, Napi::Object exports);
}
