#include "adapter.h"
#include "status_mapping.h"
#include <OneAuth/OneAuthWin.hpp>
#include <atomic>
#include <chrono>
#include <limits>
#include <memory>
#include <stdexcept>

using namespace Microsoft::Authentication;

namespace {
std::atomic<bool> owns_runtime{false};

struct Session
{
    std::shared_ptr<IAuthenticator> authenticator;
    std::shared_ptr<Account> account;
    UxContextHandle ux = OneAuth::DefaultUxContext;
    std::string default_scope;
    std::unordered_map<std::string, std::string> additional_parameters;
    bool started = false;

    ~Session()
    {
        if (started)
        {
            if (ux != OneAuth::DefaultUxContext) OneAuth::ReleaseUxContext(ux);
            authenticator.reset();
            OneAuth::Shutdown();
        }
        owns_runtime = false;
    }
};

struct Acquisition
{
    Session& session;
    bool acquire;
    PocCompletion completion;
    void* context;
    std::atomic<bool> consumed{false};

    Acquisition(Session& owner, bool child, PocCompletion callback, void* state)
        : session(owner), acquire(child), completion(callback), context(state) {}

    void Fill(const AuthResult& result) noexcept
    {
        if (consumed.exchange(true)) return;
        PocToken token{};
        int32_t status = -1;
        std::string access, id, scope, home, environment;
        try
        {
            const auto error = result.GetError();
            status = OneAuthPoc::MapStatus(error != nullptr, error ? static_cast<int32_t>(error->GetStatus()) : 0);
            if (!error)
            {
                const auto account = result.GetAccount();
                if (!account) throw std::runtime_error("Missing account");
                if (!acquire) session.account = account;
                else
                {
                    const auto credential = result.GetCredential();
                    if (!credential) throw std::runtime_error("Missing credential");
                    access = credential->GetValue();
                    id = result.GetIdToken();
                    scope = credential->GetTarget();
                    home = account->GetHomeAccountId();
                    environment = account->GetEnvironment();
                    const auto seconds = std::chrono::duration_cast<std::chrono::seconds>(
                        credential->GetExpiresOn() - std::chrono::system_clock::now()).count();
                    const auto expires = seconds > 0 && seconds <= (std::numeric_limits<int32_t>::max)()
                        ? static_cast<int32_t>(seconds) : 0;
                    token = {access.c_str(), id.c_str(), scope.c_str(), home.c_str(), environment.c_str(), expires};
                }
            }
        }
        catch (...) { status = -1; token = {}; }
        try { completion(status, &token, context); }
        catch (...) {}
    }
};
}

int32_t __cdecl poc_start_v2(const char* application_id, const char* client_id, const char* redirect_uri,
    const char* default_scope, void* window, const char* test_slice, void** session)
{
    if (!session) return -1;
    *session = nullptr;
    if (!application_id || !client_id || !redirect_uri || !default_scope || !window || !test_slice || owns_runtime.exchange(true)) return -1;
    try
    {
        auto owner = std::make_unique<Session>();
        owner->default_scope = default_scope;
        owner->additional_parameters.emplace("is_scope_request", "1");
        if (*test_slice) owner->additional_parameters.emplace("dc", test_slice);
        const OneAuthConfiguration config{AppConfiguration{application_id, "MSAL Native Bridge POC", "0.1.0", "en", 145, false, *test_slice != '\0'},
            AadConfiguration{UUID::FromString(client_id), redirect_uri, "https://graph.microsoft.com"},
            std::nullopt, std::nullopt, std::nullopt, std::nullopt};
        if (const auto error = OneAuth::Startup(config))
        {
            return OneAuthPoc::MapStatus(true, static_cast<int32_t>(error->GetStatus()));
        }
        owner->started = true;
        owner->authenticator = OneAuth::GetAuthenticator();
        owner->ux = OneAuth::CreateUxContext(static_cast<HWND>(window), nullptr, L"MSAL Native Bridge POC");
        if (!owner->authenticator || owner->ux == OneAuth::DefaultUxContext) throw std::runtime_error("Startup failed");
        *session = owner.release();
        return 0;
    }
    catch (...)
    {
        owns_runtime = false;
        return -1;
    }
}

int32_t __cdecl poc_acquire(void* session, const char* authority, const char* target, const char* child_client_id,
    const char* nested_redirect_uri, const char* claims, const char* correlation_id, const char* home_account_id,
    int32_t acquire, int32_t interactive, PocCompletion completion, void* context)
{
    if (!session || !authority || !target || !child_client_id || !nested_redirect_uri || !claims ||
        !correlation_id || !home_account_id || !completion ||
        (acquire != 0 && acquire != 1) || (interactive != 0 && interactive != 1)) return -1;
    std::shared_ptr<Acquisition> operation;
    try
    {
        auto& owner = *static_cast<Session*>(session);
        if (acquire && (!owner.account ||
            (*home_account_id && home_account_id != owner.account->GetHomeAccountId()))) return -1;
        auto parameters = acquire
            ? AuthParameters::CreateForBearer(authority, target, "", claims, owner.additional_parameters)
            : AuthParameters::CreateForBearer(authority, owner.default_scope, "", "", owner.additional_parameters);
        if (acquire) parameters.SetNestedClientParams(child_client_id, nested_redirect_uri);
        else if (interactive) parameters.SetRequestOptions({{RequestOptions::EnableIdSignInUx, RequestOptions::Enabled}});
        const TelemetryParameters telemetry{UUID::FromString(correlation_id)};
        operation = std::make_shared<Acquisition>(owner, acquire != 0, completion, context);
        auto callback = [operation](const AuthResult& result) noexcept { operation->Fill(result); };
        if (acquire && interactive)
            owner.authenticator->AcquireCredentialInteractively(owner.ux, *owner.account, parameters, telemetry, std::move(callback));
        else if (acquire)
            owner.authenticator->AcquireCredentialSilently(*owner.account, parameters, telemetry, std::move(callback));
        else if (interactive)
            owner.authenticator->SignInInteractively(owner.ux, "", parameters, std::nullopt, telemetry, std::move(callback));
        else
            owner.authenticator->SignInSilently(parameters, telemetry, std::move(callback));
        return 0;
    }
    catch (...) { return operation && operation->consumed.load() ? 0 : -1; }
}

void __cdecl poc_stop(void* session)
{
    if (!session) return;
    delete static_cast<Session*>(session);
}

void __cdecl poc_cancel(void* session, const char* correlation_id)
{
    if (!session || !correlation_id) return;
    static_cast<Session*>(session)->authenticator->CancelAllTasks(TelemetryParameters{UUID::FromString(correlation_id)});
}