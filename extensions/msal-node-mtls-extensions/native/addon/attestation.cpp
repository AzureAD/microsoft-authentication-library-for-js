/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * attestation.cpp
 * AttestationClientLib.dll integration via LoadLibrary + GetProcAddress.
 *
 * Correct API from AttestationApi.h (NuGet package v1.1.5):
 *
 *   long InitAttestationLib(AttestationLogInfo* log_info);
 *
 *   long AttestKeyGuardImportKey(
 *       const char* attestation_endpoint,   // MAA endpoint URL
 *       const char* auth_token,             // token for MAA (from IMDS)
 *       const char* client_payload,         // optional JSON with nonce
 *       NCRYPT_KEY_HANDLE import_key_handle,// KeyGuard key handle
 *       char** attestation_token,           // out: null-terminated JWT
 *       const char* client_id = nullptr);   // optional
 *
 *   void FreeAttestationToken(char* attestation_token);
 *   void UninitAttestationLib();
 *
 * JS export:
 *   getAttestationToken(handleId, attestationEndpoint, maaAuthToken, clientPayload, clientId) -> string
 */

#include "attestation.h"
#include "cng_key.h"
#include <Windows.h>
#include <ncrypt.h>
#include <string>
#include <mutex>

// ── AttestationLogInfo (mirrors AttestationLogInfo.h) ─────────────────────────
enum class LogLevel { Error, Warn, Info, Debug };
typedef void (*AttestationLogFunc)(void* ctx, const char* tag, LogLevel lvl,
                                   const char* func, int line, const char* msg);
struct AttestationLogInfo { AttestationLogFunc Log; void* Ctx; };

// ── Function typedefs (matching AttestationApi.h exactly) ─────────────────────
typedef long (*InitAttestationLibFn)(AttestationLogInfo*);
typedef void (*UninitAttestationLibFn)();
typedef long (*AttestKeyGuardImportKeyFn)(const char* attestation_endpoint,
                                          const char* auth_token,
                                          const char* client_payload,
                                          NCRYPT_KEY_HANDLE import_key_handle,
                                          char** attestation_token,
                                          const char* client_id);
typedef void (*FreeAttestationTokenFn)(char*);

// ── Lazy-loaded DLL state ──────────────────────────────────────────────────────
static HMODULE                   gDll      = nullptr;
static bool                      gTried    = false;
static std::mutex                gMutex;
static InitAttestationLibFn      fnInit    = nullptr;
static UninitAttestationLibFn    fnUninit  = nullptr;
static AttestKeyGuardImportKeyFn fnAttest  = nullptr;
static FreeAttestationTokenFn    fnFree    = nullptr;

// Stub logger — discards all messages (DLL requires non-null AttestationLogInfo)
static void StubLog(void*, const char*, LogLevel, const char*, int, const char*) {}

static bool LoadAttestationDll() {
    std::lock_guard<std::mutex> lk(gMutex);
    if (gTried) return gDll != nullptr;
    gTried = true;

    gDll = LoadLibraryA("AttestationClientLib.dll");
    if (!gDll) return false;

    fnInit   = (InitAttestationLibFn)      GetProcAddress(gDll, "InitAttestationLib");
    fnUninit = (UninitAttestationLibFn)    GetProcAddress(gDll, "UninitAttestationLib");
    fnAttest = (AttestKeyGuardImportKeyFn) GetProcAddress(gDll, "AttestKeyGuardImportKey");
    fnFree   = (FreeAttestationTokenFn)    GetProcAddress(gDll, "FreeAttestationToken");

    if (!fnInit || !fnAttest || !fnFree) {
        FreeLibrary(gDll); gDll = nullptr; return false;
    }

    // InitAttestationLib requires AttestationLogInfo* (cannot be null per header)
    static AttestationLogInfo logInfo = { StubLog, nullptr };
    long rc = fnInit(&logInfo);
    if (rc != 0) {
        FreeLibrary(gDll); gDll = nullptr; return false;
    }
    return true;
}

// getAttestationToken(handleId, attestationEndpoint, maaAuthToken, clientPayload, clientId) -> string
static Napi::Value GetAttestationToken(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsString() || !info[2].IsString()) {
        Napi::TypeError::New(env,
            "getAttestationToken(handleId: number, endpoint: string, maaToken: string, "
            "[payload: string], [clientId: string])").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    int64_t handleId = static_cast<int64_t>(info[0].As<Napi::Number>().DoubleValue());
    std::string endpoint    = info[1].As<Napi::String>().Utf8Value();
    std::string maaToken    = info[2].As<Napi::String>().Utf8Value();
    std::string payload     = (info.Length() > 3 && info[3].IsString())
                                ? info[3].As<Napi::String>().Utf8Value() : "";
    std::string clientId    = (info.Length() > 4 && info[4].IsString())
                                ? info[4].As<Napi::String>().Utf8Value() : "";

    auto* keyInfo = CngKey::GetKeyInfoFromHandle(handleId);
    if (!keyInfo) {
        Napi::Error::New(env, "Invalid key handle").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // Only VBS-protected keys need attestation
    if (!keyInfo->isVbsProtected) {
        return Napi::String::New(env, "");
    }

    if (!LoadAttestationDll()) {
        return Napi::String::New(env, ""); // DLL not present → no attestation
    }

    char* token = nullptr;
    long rc = fnAttest(
        endpoint.c_str(),
        maaToken.empty()   ? nullptr : maaToken.c_str(),
        payload.empty()    ? nullptr : payload.c_str(),
        keyInfo->handle,
        &token,
        clientId.empty()   ? nullptr : clientId.c_str()
    );

    // Check token presence FIRST — DLL may set a valid token even when rc != 0
    // (MSAL.NET's managed wrapper follows this pattern)
    if (token && token[0] != '\0') {
        std::string jwt(token);
        fnFree(token);
        return Napi::String::New(env, jwt);
    }

    if (token) fnFree(token);

    if (rc != 0) {
        std::string err = "AttestKeyGuardImportKey failed: rc=" + std::to_string(rc);
        Napi::Error::New(env, err).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // rc == 0, no token — unexpected
    Napi::Error::New(env, "AttestKeyGuardImportKey returned rc=0 but no token").ThrowAsJavaScriptException();
    return env.Undefined();
}

void Attestation::Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getAttestationToken", Napi::Function::New(env, GetAttestationToken));
}
