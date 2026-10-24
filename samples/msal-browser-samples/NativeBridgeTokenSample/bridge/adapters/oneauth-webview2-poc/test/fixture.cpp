#include "../adapter.h"
#include "../status_mapping.h"
#include <Windows.h>
#include <cstring>
#include <thread>

// Test-only DLL: exercises P/Invoke ordering without OneAuth or real credentials.
namespace {
DWORD ui_thread;
std::thread worker;
PocCompletion pending;
void* pending_context;
int32_t pending_status;
int bootstrap_calls;
bool bootstrap_succeeded;
}

int32_t __cdecl poc_start_v2(const char* application_id, const char*, const char*, const char*, void*, const char* test_slice, void** session)
{
    const char* expected_slice = std::strcmp(application_id, "test-slice") == 0 ? "synthetic-test-slice" : "";
    if (!test_slice || std::strcmp(test_slice, expected_slice) != 0) return -1;
    ui_thread = GetCurrentThreadId();
    bootstrap_calls = 0;
    bootstrap_succeeded = false;
    *session = &ui_thread;
    return 0;
}

int32_t __cdecl poc_acquire(void*, const char* authority, const char* target, const char* child_client_id,
    const char* redirect, const char* claims, const char* correlation, const char* account,
    int32_t acquire, int32_t interactive, PocCompletion completion, void* context)
{
    if (GetCurrentThreadId() != ui_thread || worker.joinable() || pending) return -1;
    const bool child1 = std::strcmp(child_client_id, "22222222-2222-2222-2222-222222222222") == 0 &&
        std::strcmp(redirect, "brk-multihub://bridge-poc.local") == 0;
    const bool child2 = std::strcmp(child_client_id, "33333333-3333-3333-3333-333333333333") == 0 &&
        std::strcmp(redirect, "brk-multihub://app2.bridge-poc.local") == 0;
    if ((!child1 && !child2) || std::strcmp(authority, "https://login.microsoftonline.com/organizations") != 0 ||
        std::strcmp(target, "https://graph.microsoft.com/User.Read") != 0 ||
        std::strcmp(correlation, "44444444-4444-4444-4444-444444444444") != 0 ||
        std::strcmp(account, "home") != 0 ||
        (std::strcmp(claims, "{}") != 0 && std::strcmp(claims, "wait-cancel") != 0 &&
            std::strcmp(claims, "dispose-after-completion") != 0 &&
            std::strcmp(claims, "bootstrap-unexpected") != 0 &&
            std::strcmp(claims, "inline-success") != 0 &&
            std::strcmp(claims, "inline-interaction-required") != 0)) return -1;
    if (!acquire && ++bootstrap_calls > 3) return -1;
    if (std::strcmp(claims, "bootstrap-unexpected") == 0)
    {
        if (acquire || interactive || bootstrap_calls != 1) return -1;
        PocToken token{};
        completion(OneAuthPoc::MapStatus(true, 0), &token, context);
        return 0;
    }
    if (std::strcmp(claims, "inline-success") == 0 ||
        std::strcmp(claims, "inline-interaction-required") == 0)
    {
        if (bootstrap_calls != 2 || (acquire && !bootstrap_succeeded)) return -1;
        const bool needs_interaction = std::strcmp(claims, "inline-interaction-required") == 0 && !interactive;
        PocToken token{};
        if (!needs_interaction)
        {
            if (acquire) token = {"test-access-token", "test-child-id-token", "User.Read", "home", "login.microsoftonline.com", 3600};
            else bootstrap_succeeded = true;
        }
        completion(OneAuthPoc::MapStatus(needs_interaction, 2), &token, context);
        return 0;
    }
    if (std::strcmp(claims, "wait-cancel") == 0 ||
        (std::strcmp(claims, "dispose-after-completion") == 0 && !interactive))
    {
        pending = completion;
        pending_context = context;
        pending_status = OneAuthPoc::MapStatus(true, std::strcmp(claims, "wait-cancel") == 0 ? 8 : 2);
        return 0;
    }
    worker = std::thread([=]
    {
        PocToken token{};
        if (acquire) token = {"test-access-token", "test-child-id-token", "User.Read", "home", "login.microsoftonline.com", 3600};
        completion(OneAuthPoc::MapStatus(!interactive, 2), &token, context);
    });
    return 0;
}

void __cdecl poc_cancel(void*, const char*)
{
    if (GetCurrentThreadId() != ui_thread) std::terminate();
    if (worker.joinable()) worker.join();
    if (pending)
    {
        auto completion = pending;
        pending = nullptr;
        PocToken token{};
        completion(pending_status, &token, pending_context);
    }
}

void __cdecl poc_stop(void*)
{
    if (GetCurrentThreadId() != ui_thread || worker.joinable() || pending) std::terminate();
}