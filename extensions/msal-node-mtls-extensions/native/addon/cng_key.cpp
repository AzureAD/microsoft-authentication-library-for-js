/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * cng_key.cpp
 * CNG key management for mTLS PoP Managed Identity.
 *
 * Implements the 3-level fallback from msal-dotnet WindowsManagedIdentityKeyProvider.cs:
 *   1. KeyGuard: NCrypt Software KSP + USER scope + VBS isolation flags
 *      Key verified via NCryptGetProperty("Virtual Iso") → must be non-zero
 *   2. Software:  NCrypt Software KSP + USER scope, persisted, no VBS flags
 *   3. InMemory:  Not implemented yet (rare fallback; adds complexity)
 *
 * Key properties (from msal-dotnet):
 *   - RSA 2048 bits
 *   - Export policy: NCRYPT_ALLOW_EXPORT_NONE (non-exportable)
 *   - Scope: USER (no NCRYPT_MACHINE_KEY_FLAG) — critical for VBS
 *
 * The public key is exported as a BCRYPT_RSAPUBLIC_BLOB and re-encoded as
 * SubjectPublicKeyInfo DER for CSR generation.
 *
 * Signing: RSASSA-PSS with SHA-256, salt length = 32 (matches msal-dotnet).
 */

#include "cng_key.h"
#include <bcrypt.h>
#include <map>
#include <mutex>
#include <sstream>
#include <stdexcept>

#pragma comment(lib, "ncrypt.lib")
#pragma comment(lib, "bcrypt.lib")
#pragma comment(lib, "crypt32.lib")

// ── Constants (from msal-dotnet WindowsManagedIdentityKeyProvider.cs) ──────────
static const LPCWSTR kMsKSP       = L"Microsoft Software Key Storage Provider";
static const DWORD   kKeyBits     = 2048;
static const DWORD   kExportNone  = 0;  // no export flags → non-exportable

// VBS isolation flags (from ncrypt.h)
#ifndef NCRYPT_USE_VIRTUAL_ISOLATION_FLAG
#define NCRYPT_USE_VIRTUAL_ISOLATION_FLAG 0x00020000
#endif
#ifndef NCRYPT_USE_PER_BOOT_KEY_FLAG
#define NCRYPT_USE_PER_BOOT_KEY_FLAG 0x00040000
#endif
#ifndef NCRYPT_OVERWRITE_KEY_FLAG
#define NCRYPT_OVERWRITE_KEY_FLAG 0x00000080
#endif
#ifndef NCRYPT_SILENT_FLAG
#define NCRYPT_SILENT_FLAG 0x00000040
#endif

// ── Key store (maps JS handle id → KeyInfo) ──────────────────────────────────
static std::map<int64_t, CngKey::KeyInfo*> gKeyStore;
static std::mutex gKeyStoreMutex;
static int64_t gNextHandleId = 1;

CngKey::KeyInfo* CngKey::GetKeyInfoFromHandle(int64_t handleId) {
    std::lock_guard<std::mutex> lock(gKeyStoreMutex);
    auto it = gKeyStore.find(handleId);
    if (it == gKeyStore.end()) return nullptr;
    return it->second;
}

void CngKey::FreeKeyInfo(int64_t handleId) {
    std::lock_guard<std::mutex> lock(gKeyStoreMutex);
    auto it = gKeyStore.find(handleId);
    if (it != gKeyStore.end()) {
        if (it->second->handle) NCryptFreeObject(it->second->handle);
        delete it->second;
        gKeyStore.erase(it);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

static std::string NtStatusToString(SECURITY_STATUS status) {
    std::ostringstream oss;
    oss << "NTSTATUS 0x" << std::hex << (unsigned long)status;
    return oss.str();
}

// Check if a key handle is VBS-protected by reading the "Virtual Iso" property.
// Returns true if the property value is non-zero.
static bool IsKeyVbsProtected(NCRYPT_KEY_HANDLE hKey) {
    DWORD value = 0;
    DWORD cbResult = 0;
    SECURITY_STATUS status = NCryptGetProperty(
        hKey, L"Virtual Iso",
        reinterpret_cast<PBYTE>(&value), sizeof(value),
        &cbResult, 0);
    return (status == ERROR_SUCCESS && value != 0);
}

// Try to create or open a KeyGuard key.
// Returns ERROR_SUCCESS on success, or an NTSTATUS error code.
static SECURITY_STATUS TryCreateKeyGuard(
    NCRYPT_PROV_HANDLE hProv,
    const std::wstring& keyName,
    NCRYPT_KEY_HANDLE& hKey)
{
    // Try to open existing KeyGuard key first
    SECURITY_STATUS status = NCryptOpenKey(hProv, &hKey, keyName.c_str(), AT_KEYEXCHANGE, 0);
    if (status == ERROR_SUCCESS) {
        // Verify it's still VBS-protected
        if (IsKeyVbsProtected(hKey)) {
            return ERROR_SUCCESS;
        }
        // Not VBS anymore — delete the non-VBS key and recreate as KeyGuard
        NCryptDeleteKey(hKey, 0); // deletes the key and frees the handle
        hKey = 0;
    }

    // Create a new KeyGuard key — pass VBS flags to NCryptCreatePersistedKey
    DWORD createFlags = NCRYPT_OVERWRITE_KEY_FLAG | NCRYPT_USE_VIRTUAL_ISOLATION_FLAG | NCRYPT_USE_PER_BOOT_KEY_FLAG;
    status = NCryptCreatePersistedKey(hProv, &hKey, NCRYPT_RSA_ALGORITHM, keyName.c_str(), 0, createFlags);
    if (status != ERROR_SUCCESS) return status;

    // Set key size (2048 bits)
    DWORD keyBits = kKeyBits;
    status = NCryptSetProperty(hKey, NCRYPT_LENGTH_PROPERTY, reinterpret_cast<PBYTE>(&keyBits), sizeof(keyBits), NCRYPT_SILENT_FLAG);
    if (status != ERROR_SUCCESS) { NCryptFreeObject(hKey); hKey = 0; return status; }

    // Set non-exportable
    DWORD exportPolicy = kExportNone;
    status = NCryptSetProperty(hKey, NCRYPT_EXPORT_POLICY_PROPERTY, reinterpret_cast<PBYTE>(&exportPolicy), sizeof(exportPolicy), NCRYPT_SILENT_FLAG);
    if (status != ERROR_SUCCESS) { NCryptFreeObject(hKey); hKey = 0; return status; }

    // Finalize (NCRYPT_SILENT_FLAG only — VBS flags were set at CreatePersistedKey time)
    status = NCryptFinalizeKey(hKey, NCRYPT_SILENT_FLAG);
    if (status != ERROR_SUCCESS) { NCryptFreeObject(hKey); hKey = 0; return status; }

    // Verify VBS protection was applied
    if (!IsKeyVbsProtected(hKey)) {
        NCryptDeleteKey(hKey, 0);  // delete and free
        hKey = 0;
        return (SECURITY_STATUS)NTE_BAD_FLAGS; // VBS not active
    }

    return ERROR_SUCCESS;
}

// Try to create or open a Software KSP key (fallback when VBS unavailable).
static SECURITY_STATUS TryCreateSoftwareKey(
    NCRYPT_PROV_HANDLE hProv,
    const std::wstring& keyName,
    NCRYPT_KEY_HANDLE& hKey)
{
    // Try open existing
    SECURITY_STATUS status = NCryptOpenKey(hProv, &hKey, keyName.c_str(), AT_KEYEXCHANGE, 0);
    if (status == ERROR_SUCCESS) return ERROR_SUCCESS;

    // Create new
    status = NCryptCreatePersistedKey(hProv, &hKey, NCRYPT_RSA_ALGORITHM, keyName.c_str(), AT_KEYEXCHANGE, 0);
    if (status != ERROR_SUCCESS) return status;

    DWORD keyBits = kKeyBits;
    NCryptSetProperty(hKey, NCRYPT_LENGTH_PROPERTY, reinterpret_cast<PBYTE>(&keyBits), sizeof(keyBits), 0);

    DWORD exportPolicy = kExportNone;
    NCryptSetProperty(hKey, NCRYPT_EXPORT_POLICY_PROPERTY, reinterpret_cast<PBYTE>(&exportPolicy), sizeof(exportPolicy), 0);

    status = NCryptFinalizeKey(hKey, 0);
    if (status != ERROR_SUCCESS) { NCryptFreeObject(hKey); hKey = 0; return status; }

    return ERROR_SUCCESS;
}

// Export the RSA public key from a CNG handle as SubjectPublicKeyInfo DER.
// SubjectPublicKeyInfo ::= SEQUENCE {
//   algorithm   AlgorithmIdentifier,  -- OID 1.2.840.113549.1.1.1 (rsaEncryption) + NULL params
//   subjectPublicKey  BIT STRING       -- DER-encoded RSAPublicKey
// }
static std::vector<BYTE> ExportPublicKeyDer(NCRYPT_KEY_HANDLE hKey) {
    // Export the raw BCRYPT_RSAPUBLIC_BLOB from the NCrypt key
    DWORD cbKey = 0;
    SECURITY_STATUS status = NCryptExportKey(hKey, 0, BCRYPT_RSAPUBLIC_BLOB, nullptr, nullptr, 0, &cbKey, 0);
    if (status != ERROR_SUCCESS) throw std::runtime_error("NCryptExportKey (size) failed: " + NtStatusToString(status));

    std::vector<BYTE> keyBlob(cbKey);
    status = NCryptExportKey(hKey, 0, BCRYPT_RSAPUBLIC_BLOB, nullptr, keyBlob.data(), cbKey, &cbKey, 0);
    if (status != ERROR_SUCCESS) throw std::runtime_error("NCryptExportKey failed: " + NtStatusToString(status));

    // Parse the BCRYPT_RSAKEY_BLOB header
    const auto* header = reinterpret_cast<const BCRYPT_RSAKEY_BLOB*>(keyBlob.data());
    if (header->Magic != BCRYPT_RSAPUBLIC_MAGIC)
        throw std::runtime_error("Invalid BCRYPT_RSAPUBLIC_BLOB magic");

    const BYTE* pubExp = keyBlob.data() + sizeof(BCRYPT_RSAKEY_BLOB);
    const BYTE* modulus = pubExp + header->cbPublicExp;

    // rsaEncryption OID: 1.2.840.113549.1.1.1 with NULL params
    static const BYTE kRsaAlgId[] = {
        0x30, 0x0d, // SEQUENCE (13 bytes)
          0x06, 0x09, // OID (9 bytes)
            0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // rsaEncryption
          0x05, 0x00  // NULL
    };

    // Build ASN.1 DER INTEGER from big-endian bytes (prepend 0x00 if high bit set)
    auto makeInt = [](const BYTE* data, DWORD len) -> std::vector<BYTE> {
        bool needLeading = (data[0] & 0x80) != 0;
        size_t valLen = len + (needLeading ? 1 : 0);
        std::vector<BYTE> r = { 0x02 }; // INTEGER tag
        if (valLen < 0x80) r.push_back((BYTE)valLen);
        else if (valLen < 0x100) { r.push_back(0x81); r.push_back((BYTE)valLen); }
        else { r.push_back(0x82); r.push_back((BYTE)(valLen >> 8)); r.push_back((BYTE)(valLen & 0xff)); }
        if (needLeading) r.push_back(0x00);
        r.insert(r.end(), data, data + len);
        return r;
    };

    auto encodeLen = [](size_t len) -> std::vector<BYTE> {
        if (len < 0x80) return { (BYTE)len };
        if (len < 0x100) return { 0x81, (BYTE)len };
        return { 0x82, (BYTE)(len >> 8), (BYTE)(len & 0xff) };
    };

    auto modInt = makeInt(modulus, header->cbModulus);
    auto expInt = makeInt(pubExp, header->cbPublicExp);

    // RSAPublicKey SEQUENCE { modulus, publicExponent }
    size_t rsaSeqLen = modInt.size() + expInt.size();
    std::vector<BYTE> rsaSeq = { 0x30 };
    auto r1 = encodeLen(rsaSeqLen);
    rsaSeq.insert(rsaSeq.end(), r1.begin(), r1.end());
    rsaSeq.insert(rsaSeq.end(), modInt.begin(), modInt.end());
    rsaSeq.insert(rsaSeq.end(), expInt.begin(), expInt.end());

    // BIT STRING = 0x03 + len + 0x00 (unused bits) + rsaSeq
    std::vector<BYTE> bitStr = { 0x03 };
    auto r2 = encodeLen(rsaSeq.size() + 1);
    bitStr.insert(bitStr.end(), r2.begin(), r2.end());
    bitStr.push_back(0x00);
    bitStr.insert(bitStr.end(), rsaSeq.begin(), rsaSeq.end());

    // SubjectPublicKeyInfo SEQUENCE { algorithm, subjectPublicKey }
    size_t spkiLen = sizeof(kRsaAlgId) + bitStr.size();
    std::vector<BYTE> spki = { 0x30 };
    auto r3 = encodeLen(spkiLen);
    spki.insert(spki.end(), r3.begin(), r3.end());
    spki.insert(spki.end(), kRsaAlgId, kRsaAlgId + sizeof(kRsaAlgId));
    spki.insert(spki.end(), bitStr.begin(), bitStr.end());

    return spki;
}

// ── N-API exports ─────────────────────────────────────────────────────────────

// createOrOpenKey(keyName: string, forceKeyGuard?: boolean)
// -> { handleId: number, level: 'KeyGuard'|'Software', isVbsProtected: boolean }
static Napi::Value CreateOrOpenKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "keyName (string) required").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    std::string keyNameUtf8 = info[0].As<Napi::String>().Utf8Value();
    bool forceKeyGuard = info.Length() > 1 && info[1].ToBoolean().Value();

    // Convert keyName to wide string
    int wlen = MultiByteToWideChar(CP_UTF8, 0, keyNameUtf8.c_str(), -1, nullptr, 0);
    std::wstring keyName(wlen, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, keyNameUtf8.c_str(), -1, keyName.data(), wlen);

    NCRYPT_PROV_HANDLE hProv = 0;
    SECURITY_STATUS status = NCryptOpenStorageProvider(&hProv, kMsKSP, 0);
    if (status != ERROR_SUCCESS) {
        Napi::Error::New(env, "NCryptOpenStorageProvider failed: " + NtStatusToString(status)).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    NCRYPT_KEY_HANDLE hKey = 0;
    CngKey::KeyLevel level = CngKey::KeyLevel::Software;
    bool isVbs = false;

    // Try Level 1: KeyGuard (VBS-protected) — use the exact keyName (no suffix)
    // This matches MSAL.NET's naming convention (MSALMtlsKey_{vmId} with no _kg suffix)
    // so that AttestKeyGuardImportKey attests the same key we use for the CSR.
    SECURITY_STATUS kgStatus = TryCreateKeyGuard(hProv, keyName, hKey);
    if (kgStatus == ERROR_SUCCESS) {
        level = CngKey::KeyLevel::KeyGuard;
        isVbs = true;
    } else if (!forceKeyGuard) {
        // Level 2: Software fallback — same exact keyName
        std::wstring swKeyName = keyName + L"_sw";
        status = TryCreateSoftwareKey(hProv, swKeyName, hKey);
        if (status != ERROR_SUCCESS) {
            NCryptFreeObject(hProv);
            Napi::Error::New(env, "Failed to create key (KeyGuard failed: " + NtStatusToString(kgStatus) + ", Software failed: " + NtStatusToString(status) + ")").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        level = CngKey::KeyLevel::Software;
        isVbs = false;
    } else {
        NCryptFreeObject(hProv);
        Napi::Error::New(env, "KeyGuard key creation failed (VBS unavailable?): " + NtStatusToString(kgStatus)).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    NCryptFreeObject(hProv);

    // Store key info (include keyName for CERT_KEY_PROV_INFO_PROP_ID later)
    auto* keyInfo = new CngKey::KeyInfo{ hKey, level, isVbs, keyName };
    int64_t handleId;
    {
        std::lock_guard<std::mutex> lock(gKeyStoreMutex);
        handleId = gNextHandleId++;
        gKeyStore[handleId] = keyInfo;
    }

    auto result = Napi::Object::New(env);
    result.Set("handleId", Napi::Number::New(env, static_cast<double>(handleId)));
    result.Set("level", Napi::String::New(env, level == CngKey::KeyLevel::KeyGuard ? "KeyGuard" : "Software"));
    result.Set("isVbsProtected", Napi::Boolean::New(env, isVbs));
    return result;
}

// closeKey(handleId: number)
static Napi::Value CloseKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "handleId (number) required").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    int64_t handleId = static_cast<int64_t>(info[0].As<Napi::Number>().DoubleValue());
    CngKey::FreeKeyInfo(handleId);
    return env.Undefined();
}

// getPublicKeyDer(handleId: number) -> Buffer (SubjectPublicKeyInfo DER)
static Napi::Value GetPublicKeyDer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "handleId (number) required").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    int64_t handleId = static_cast<int64_t>(info[0].As<Napi::Number>().DoubleValue());
    auto* keyInfo = CngKey::GetKeyInfoFromHandle(handleId);
    if (!keyInfo) {
        Napi::Error::New(env, "Invalid key handle").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        auto der = ExportPublicKeyDer(keyInfo->handle);
        return Napi::Buffer<BYTE>::Copy(env, der.data(), der.size());
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("getPublicKeyDer: ") + e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

// signHashPss(handleId: number, hash: Buffer) -> Buffer
// Signs using RSASSA-PSS with SHA-256 hash, salt length = 32 (matches msal-dotnet)
static Napi::Value SignHashPss(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsBuffer()) {
        Napi::TypeError::New(env, "signHashPss(handleId: number, hash: Buffer)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    int64_t handleId = static_cast<int64_t>(info[0].As<Napi::Number>().DoubleValue());
    auto* keyInfo = CngKey::GetKeyInfoFromHandle(handleId);
    if (!keyInfo) {
        Napi::Error::New(env, "Invalid key handle").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    auto hashBuf = info[1].As<Napi::Buffer<BYTE>>();
    if (hashBuf.ByteLength() != 32) {
        Napi::Error::New(env, "Hash must be 32 bytes (SHA-256)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // RSASSA-PSS with SHA-256, salt length = 32
    BCRYPT_PSS_PADDING_INFO paddingInfo = {};
    paddingInfo.pszAlgId = BCRYPT_SHA256_ALGORITHM;
    paddingInfo.cbSalt = 32;

    DWORD cbSig = 0;
    SECURITY_STATUS status = NCryptSignHash(
        keyInfo->handle,
        &paddingInfo,
        hashBuf.Data(), static_cast<DWORD>(hashBuf.ByteLength()),
        nullptr, 0, &cbSig,
        BCRYPT_PAD_PSS);
    if (status != ERROR_SUCCESS) {
        Napi::Error::New(env, "NCryptSignHash (size) failed: " + NtStatusToString(status)).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::vector<BYTE> sig(cbSig);
    status = NCryptSignHash(
        keyInfo->handle,
        &paddingInfo,
        hashBuf.Data(), static_cast<DWORD>(hashBuf.ByteLength()),
        sig.data(), cbSig, &cbSig,
        BCRYPT_PAD_PSS);
    if (status != ERROR_SUCCESS) {
        Napi::Error::New(env, "NCryptSignHash failed: " + NtStatusToString(status)).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    return Napi::Buffer<BYTE>::Copy(env, sig.data(), cbSig);
}

// ── Module init ───────────────────────────────────────────────────────────────
void CngKey::Init(Napi::Env env, Napi::Object exports) {
    exports.Set("createOrOpenKey", Napi::Function::New(env, CreateOrOpenKey));
    exports.Set("closeKey",        Napi::Function::New(env, CloseKey));
    exports.Set("getPublicKeyDer", Napi::Function::New(env, GetPublicKeyDer));
    exports.Set("signHashPss",     Napi::Function::New(env, SignHashPss));
}
