/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * winhttp_mtls.cpp
 * WinHTTP mTLS HTTP client for msal-node-mtls-extensions.
 *
 * Key design decision:
 *   WINHTTP_OPTION_CLIENT_CERT_CONTEXT is set BEFORE WinHttpSendRequest,
 *   allowing it to be presented when the server sends TLS CertificateRequest.
 *   The mTLS Graph endpoint (mtlstb.graph.microsoft.com) and Entra mTLS endpoint
 *   both send CertificateRequest, so the cert is properly presented.
 *   System proxy settings are respected via WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY.
 *
 * The CERT_CONTEXT is created from:
 *   - certPem: DER-encoded X.509 binding certificate (from IMDS /issuecredential)
 *   - keyHandle: NCrypt handle to the non-exportable KeyGuard RSA key
 * The key is associated with the cert via both CERT_NCRYPT_KEY_HANDLE_PROP_ID and
 * CERT_KEY_PROV_INFO_PROP_ID, the latter being required for Schannel to locate the
 * non-exportable CNG key during TLS handshake.
 *
 * Flow: WinHttpOpen → WinHttpConnect → WinHttpOpenRequest →
 *       set client cert → WinHttpSendRequest → WinHttpReceiveResponse →
 *       read headers + body → return JSON.
 *
 * Runs on a libuv thread pool (AsyncWorker) so it doesn't block the JS event loop.
 */

#include "winhttp_mtls.h"
#include "cng_key.h"
#include <Windows.h>
#include <winhttp.h>
#include <wincrypt.h>
#include <ncrypt.h>
#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <stdexcept>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "crypt32.lib")
#pragma comment(lib, "ncrypt.lib")

// CERT_NCRYPT_KEY_HANDLE_PROP_ID = 78 (not always defined in older SDKs)
#ifndef CERT_NCRYPT_KEY_HANDLE_PROP_ID
#define CERT_NCRYPT_KEY_HANDLE_PROP_ID 78
#endif

// ── Helpers ───────────────────────────────────────────────────────────────────

static std::wstring Utf8ToWide(const std::string& s) {
    if (s.empty()) return L"";
    int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, nullptr, 0);
    std::wstring w(n - 1, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, w.data(), n);
    return w;
}

static std::string WideToUtf8(const std::wstring& w) {
    if (w.empty()) return "";
    int n = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), -1, nullptr, 0, nullptr, nullptr);
    std::string s(n - 1, '\0');
    WideCharToMultiByte(CP_UTF8, 0, w.c_str(), -1, s.data(), n, nullptr, nullptr);
    return s;
}

static std::string WinHttpErrorString(DWORD err) {
    std::ostringstream oss;
    oss << "WinHTTP error 0x" << std::hex << err;
    return oss.str();
}

// Decode PEM certificate to DER bytes
static std::vector<BYTE> PemToDer(const std::string& pem) {
    // Find base64 content between -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----
    const std::string begin = "-----BEGIN CERTIFICATE-----";
    const std::string end   = "-----END CERTIFICATE-----";
    auto s = pem.find(begin);
    auto e = pem.find(end);
    if (s == std::string::npos || e == std::string::npos)
        throw std::runtime_error("Invalid PEM: missing BEGIN/END markers");

    std::string b64 = pem.substr(s + begin.size(), e - s - begin.size());
    // Remove whitespace
    b64.erase(std::remove_if(b64.begin(), b64.end(), ::isspace), b64.end());

    DWORD cbDer = 0;
    if (!CryptStringToBinaryA(b64.c_str(), (DWORD)b64.size(), CRYPT_STRING_BASE64, nullptr, &cbDer, nullptr, nullptr))
        throw std::runtime_error("CryptStringToBinaryA failed");
    std::vector<BYTE> der(cbDer);
    if (!CryptStringToBinaryA(b64.c_str(), (DWORD)b64.size(), CRYPT_STRING_BASE64, der.data(), &cbDer, nullptr, nullptr))
        throw std::runtime_error("CryptStringToBinaryA (decode) failed");
    return der;
}

// Create a CERT_CONTEXT from DER bytes, associate the NCrypt key handle
static PCCERT_CONTEXT CreateCertContextWithKey(
    const std::vector<BYTE>& certDer,
    NCRYPT_KEY_HANDLE hKey,
    const std::wstring& keyName)
{
    // Create cert context from DER
    PCCERT_CONTEXT pCert = CertCreateCertificateContext(
        X509_ASN_ENCODING | PKCS_7_ASN_ENCODING,
        certDer.data(), (DWORD)certDer.size());
    if (!pCert) throw std::runtime_error("CertCreateCertificateContext failed: " +
        std::to_string(GetLastError()));

    // Associate NCrypt key handle with the cert context.
    // Set CERT_NCRYPT_KEY_HANDLE_PROP_ID so Schannel can use the non-exportable CNG key.
    // Also set CERT_KEY_PROV_INFO_PROP_ID so Schannel can find the key by name if needed.
    NCRYPT_KEY_HANDLE hKeyCopy = hKey; // non-owning reference
    if (!CertSetCertificateContextProperty(
            pCert, CERT_NCRYPT_KEY_HANDLE_PROP_ID,
            CERT_SET_PROPERTY_IGNORE_PERSIST_ERROR_FLAG,
            reinterpret_cast<const void*>(&hKeyCopy))) {
        CertFreeCertificateContext(pCert);
        throw std::runtime_error("CertSetCertificateContextProperty (NCRYPT) failed: " +
            std::to_string(GetLastError()));
    }

    // Also set CERT_KEY_PROV_INFO_PROP_ID to let Schannel find the key by name.
    // Some Schannel code paths prefer this over the raw handle property.
    if (!keyName.empty()) {
        CRYPT_KEY_PROV_INFO provInfo = {};
        provInfo.pwszContainerName = const_cast<LPWSTR>(keyName.c_str());
        provInfo.pwszProvName      = const_cast<LPWSTR>(L"Microsoft Software Key Storage Provider");
        provInfo.dwProvType        = 0; // 0 = CNG (not CAPI)
        provInfo.dwFlags           = NCRYPT_SILENT_FLAG;
        provInfo.dwKeySpec         = AT_KEYEXCHANGE;
        CertSetCertificateContextProperty(
            pCert, CERT_KEY_PROV_INFO_PROP_ID, 0,
            reinterpret_cast<const void*>(&provInfo));
    }

    return pCert;
}

// ── AsyncWorker for WinHTTP request ──────────────────────────────────────────

struct MtlsRequestOptions {
    std::string url;
    std::string method;
    std::map<std::string, std::string> headers;
    std::string body;
    std::string certPem;          // IMDS-issued binding cert (PEM)
    int64_t     keyHandleId;      // CNG key handle ID (in gKeyStore)
};

struct MtlsResponse {
    int status;
    std::map<std::string, std::string> headers;
    std::string body;
};

class MtlsAsyncWorker : public Napi::AsyncWorker {
public:
    MtlsAsyncWorker(Napi::Promise::Deferred deferred, MtlsRequestOptions opts)
        : Napi::AsyncWorker(deferred.Env()), deferred_(std::move(deferred)), opts_(std::move(opts)) {}

    void Execute() override {
        try {
            response_ = DoRequest();
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::Env env = Env();
        auto result = Napi::Object::New(env);
        result.Set("status", Napi::Number::New(env, response_.status));

        auto headers = Napi::Object::New(env);
        for (auto& [k, v] : response_.headers)
            headers.Set(k, Napi::String::New(env, v));
        result.Set("headers", headers);
        result.Set("body", Napi::String::New(env, response_.body));

        deferred_.Resolve(result);
    }

    void OnError(const Napi::Error& e) override {
        deferred_.Reject(e.Value());
    }

private:
    Napi::Promise::Deferred deferred_;
    MtlsRequestOptions opts_;
    MtlsResponse response_;

    MtlsResponse DoRequest() {
        // ── Parse URL ─────────────────────────────────────────────────────────
        std::wstring wUrl = Utf8ToWide(opts_.url);
        URL_COMPONENTS uc = {};
        uc.dwStructSize = sizeof(uc);
        WCHAR host[256] = {}, path[2048] = {};
        uc.lpszHostName    = host; uc.dwHostNameLength    = _countof(host);
        uc.lpszUrlPath     = path; uc.dwUrlPathLength     = _countof(path);
        if (!WinHttpCrackUrl(wUrl.c_str(), 0, 0, &uc))
            throw std::runtime_error("Invalid URL: " + opts_.url);

        bool isHttps = (uc.nScheme == INTERNET_SCHEME_HTTPS);
        INTERNET_PORT port = uc.nPort ? uc.nPort : (isHttps ? INTERNET_DEFAULT_HTTPS_PORT : INTERNET_DEFAULT_HTTP_PORT);

        // ── Get the CNG key + cert ────────────────────────────────────────────
        auto* keyInfo = CngKey::GetKeyInfoFromHandle(opts_.keyHandleId);
        if (!keyInfo) throw std::runtime_error("Invalid key handle");

        // Decode cert PEM → DER → CERT_CONTEXT
        std::vector<BYTE> certDer = PemToDer(opts_.certPem);
        PCCERT_CONTEXT pCert = CreateCertContextWithKey(certDer, keyInfo->handle, keyInfo->keyName);

        // ── WinHTTP session ───────────────────────────────────────────────────
        HINTERNET hSession = WinHttpOpen(
            L"msal-node-mtls/2.0",
            WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, // respect Windows system proxy settings
            WINHTTP_NO_PROXY_NAME,
            WINHTTP_NO_PROXY_BYPASS, 0);
        if (!hSession) {
            CertFreeCertificateContext(pCert);
            throw std::runtime_error("WinHttpOpen failed: " + WinHttpErrorString(GetLastError()));
        }

        HINTERNET hConnect = WinHttpConnect(hSession, host, port, 0);
        if (!hConnect) {
            DWORD err = GetLastError();
            WinHttpCloseHandle(hSession);
            CertFreeCertificateContext(pCert);
            throw std::runtime_error("WinHttpConnect failed: " + WinHttpErrorString(err));
        }

        DWORD reqFlags = isHttps ? WINHTTP_FLAG_SECURE : 0;
        std::wstring wMethod = Utf8ToWide(opts_.method.empty() ? "GET" : opts_.method);
        HINTERNET hRequest = WinHttpOpenRequest(hConnect, wMethod.c_str(), path, nullptr,
            WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, reqFlags);
        if (!hRequest) {
            DWORD err = GetLastError();
            WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
            CertFreeCertificateContext(pCert);
            throw std::runtime_error("WinHttpOpenRequest failed: " + WinHttpErrorString(err));
        }

        // ── Set client cert PROACTIVELY ───────────────────────────────────────
        // This is the key fix over the subprocess: we set the cert BEFORE SendRequest,
        // so it is always presented regardless of whether the server sends CertificateRequest.
        // WinHTTP will include it in the ClientCertificate field of the TLS ClientHello.
        if (isHttps) {
            if (!WinHttpSetOption(hRequest, WINHTTP_OPTION_CLIENT_CERT_CONTEXT,
                    (LPVOID)pCert, sizeof(CERT_CONTEXT))) {
                DWORD err = GetLastError();
                WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
                CertFreeCertificateContext(pCert);
                throw std::runtime_error("WinHttpSetOption CLIENT_CERT_CONTEXT failed: " + WinHttpErrorString(err));
            }
        }

        // ── Add headers ───────────────────────────────────────────────────────
        for (auto& [k, v] : opts_.headers) {
            std::wstring header = Utf8ToWide(k + ": " + v);
            WinHttpAddRequestHeaders(hRequest, header.c_str(), (DWORD)-1, WINHTTP_ADDREQ_FLAG_ADD);
        }

        // ── Send request ──────────────────────────────────────────────────────
        LPCVOID body    = opts_.body.empty() ? WINHTTP_NO_REQUEST_DATA : opts_.body.c_str();
        DWORD bodyLen   = opts_.body.empty() ? 0 : (DWORD)opts_.body.size();
        if (!WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0, (LPVOID)body, bodyLen, bodyLen, 0)) {
            DWORD err = GetLastError();
            WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
            CertFreeCertificateContext(pCert);
            throw std::runtime_error("WinHttpSendRequest failed: " + WinHttpErrorString(err));
        }

        if (!WinHttpReceiveResponse(hRequest, nullptr)) {
            DWORD err = GetLastError();
            WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
            CertFreeCertificateContext(pCert);
            throw std::runtime_error("WinHttpReceiveResponse failed: " + WinHttpErrorString(err));
        }

        // ── Read status ───────────────────────────────────────────────────────
        DWORD statusCode = 0;
        DWORD statusSize = sizeof(statusCode);
        WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
            WINHTTP_HEADER_NAME_BY_INDEX, &statusCode, &statusSize, WINHTTP_NO_HEADER_INDEX);

        // ── Read response headers ─────────────────────────────────────────────
        DWORD cbHeaders = 0;
        WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_RAW_HEADERS_CRLF,
            WINHTTP_HEADER_NAME_BY_INDEX, nullptr, &cbHeaders, WINHTTP_NO_HEADER_INDEX);
        std::wstring rawHeaders(cbHeaders / sizeof(WCHAR), L'\0');
        WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_RAW_HEADERS_CRLF,
            WINHTTP_HEADER_NAME_BY_INDEX, rawHeaders.data(), &cbHeaders, WINHTTP_NO_HEADER_INDEX);

        std::map<std::string, std::string> responseHeaders;
        std::wistringstream headerStream(rawHeaders);
        std::wstring line;
        bool first = true;
        while (std::getline(headerStream, line)) {
            if (first) { first = false; continue; } // skip status line
            auto colon = line.find(L':');
            if (colon != std::wstring::npos) {
                auto k = WideToUtf8(line.substr(0, colon));
                auto v = WideToUtf8(line.substr(colon + 2)); // skip ": "
                // Trim trailing \r
                if (!v.empty() && v.back() == '\r') v.pop_back();
                responseHeaders[k] = v;
            }
        }

        // ── Read body ─────────────────────────────────────────────────────────
        std::string body_str;
        DWORD cbRead = 0;
        do {
            DWORD cbAvail = 0;
            WinHttpQueryDataAvailable(hRequest, &cbAvail);
            if (cbAvail == 0) break;
            std::vector<char> buf(cbAvail + 1, 0);
            WinHttpReadData(hRequest, buf.data(), cbAvail, &cbRead);
            body_str.append(buf.data(), cbRead);
        } while (cbRead > 0);

        // ── Cleanup ───────────────────────────────────────────────────────────
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        CertFreeCertificateContext(pCert);

        return { (int)statusCode, std::move(responseHeaders), std::move(body_str) };
    }
};

// makeMtlsRequest(opts: { url, method, headers, body, certPem, keyHandleId }) -> Promise<{ status, headers, body }>
static Napi::Value MakeMtlsRequest(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto deferred = Napi::Promise::Deferred::New(env);

    if (info.Length() < 1 || !info[0].IsObject()) {
        deferred.Reject(Napi::TypeError::New(env, "opts object required").Value());
        return deferred.Promise();
    }

    auto opts = info[0].As<Napi::Object>();
    MtlsRequestOptions req;

    if (!opts.Has("url") || !opts.Get("url").IsString()) {
        deferred.Reject(Napi::TypeError::New(env, "opts.url (string) required").Value());
        return deferred.Promise();
    }
    req.url = opts.Get("url").As<Napi::String>().Utf8Value();

    req.method = opts.Has("method") && opts.Get("method").IsString()
        ? opts.Get("method").As<Napi::String>().Utf8Value() : "GET";

    if (opts.Has("headers") && opts.Get("headers").IsObject()) {
        auto hdrs = opts.Get("headers").As<Napi::Object>();
        auto names = hdrs.GetPropertyNames();
        for (uint32_t i = 0; i < names.Length(); ++i) {
            std::string k = names.Get(i).As<Napi::String>().Utf8Value();
            req.headers[k] = hdrs.Get(k).As<Napi::String>().Utf8Value();
        }
    }

    if (opts.Has("body") && opts.Get("body").IsString())
        req.body = opts.Get("body").As<Napi::String>().Utf8Value();

    if (!opts.Has("certPem") || !opts.Get("certPem").IsString()) {
        deferred.Reject(Napi::TypeError::New(env, "opts.certPem (string) required").Value());
        return deferred.Promise();
    }
    req.certPem = opts.Get("certPem").As<Napi::String>().Utf8Value();

    if (!opts.Has("keyHandleId") || !opts.Get("keyHandleId").IsNumber()) {
        deferred.Reject(Napi::TypeError::New(env, "opts.keyHandleId (number) required").Value());
        return deferred.Promise();
    }
    req.keyHandleId = static_cast<int64_t>(opts.Get("keyHandleId").As<Napi::Number>().DoubleValue());

    auto promise = deferred.Promise();  // capture before move
    auto* worker = new MtlsAsyncWorker(std::move(deferred), std::move(req));
    worker->Queue();
    return promise;
}

void WinHttpMtls::Init(Napi::Env env, Napi::Object exports) {
    exports.Set("makeMtlsRequest", Napi::Function::New(env, MakeMtlsRequest));
}
