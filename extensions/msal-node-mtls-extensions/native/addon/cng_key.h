/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * cng_key.h
 * CNG key creation/open and signing operations.
 * Mirrors msal-go cng_windows.go and msal-dotnet WindowsManagedIdentityKeyProvider.cs
 */

#pragma once
#include <napi.h>
#include <Windows.h>
#include <ncrypt.h>
#include <wincrypt.h>
#include <string>
#include <vector>

namespace CngKey {
    void Init(Napi::Env env, Napi::Object exports);

    // Key level (matches msal-dotnet's 3-level fallback)
    enum class KeyLevel {
        KeyGuard = 0,  // VBS-protected, NCrypt + NCRYPT_USE_VIRTUAL_ISOLATION_FLAG
        Software = 1,  // Software KSP, persisted in user store
        InMemory = 2   // Ephemeral RSA key (not implemented in Phase 2 — rare fallback)
    };

    struct KeyInfo {
        NCRYPT_KEY_HANDLE handle;
        KeyLevel level;
        bool isVbsProtected;
        std::wstring keyName;  // NCrypt key container name (for CERT_KEY_PROV_INFO_PROP_ID)
    };

    // Internal helpers used by attestation and winhttp modules
    KeyInfo* GetKeyInfoFromHandle(int64_t handleId);
    void FreeKeyInfo(int64_t handleId);
}
