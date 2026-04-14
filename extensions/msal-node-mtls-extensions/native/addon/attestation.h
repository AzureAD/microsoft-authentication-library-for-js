/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * attestation.h
 * AttestationClientLib.dll integration for MAA (Microsoft Azure Attestation) JWTs.
 */
#pragma once
#include <napi.h>

namespace Attestation {
    void Init(Napi::Env env, Napi::Object exports);
}
