#pragma once
#include <stdint.h>

// Only for NativeBridgeTokenSample's Windows WPF/WebView2 NAA POC. Not reusable for other hosts or authentication scenarios.
#ifdef ONEAUTH_POC_EXPORTS
#define POC_API __declspec(dllexport)
#else
#define POC_API __declspec(dllimport)
#endif
#ifdef __cplusplus
extern "C" {
#endif

typedef struct PocToken
{
    const char *access_token, *id_token, *scope, *home_account_id, *environment;
    int32_t expires_in;
} PocToken;

typedef void(__cdecl *PocCompletion)(int32_t status, const PocToken* token, void* context);

POC_API int32_t __cdecl poc_start_v2(const char* application_id, const char* client_id, const char* redirect_uri,
    const char* default_scope, void* window, const char* test_slice, void** session);
POC_API int32_t __cdecl poc_acquire(void* session, const char* authority, const char* target, const char* child_client_id,
    const char* nested_redirect_uri, const char* claims, const char* correlation_id, const char* home_account_id,
    int32_t acquire, int32_t interactive, PocCompletion completion, void* context);
POC_API void __cdecl poc_stop(void* session);
POC_API void __cdecl poc_cancel(void* session, const char* correlation_id);

#ifdef __cplusplus
}
#endif