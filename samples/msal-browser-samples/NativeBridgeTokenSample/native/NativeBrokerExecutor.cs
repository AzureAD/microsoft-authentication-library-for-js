using Identity.NativeBridge;
using Identity.NativeBridge.OneAuthPoc;

namespace NativeBridgeTokenSample;

public sealed record OneAuthSettings(string ApplicationId, string ClientId, string RedirectUri, string DefaultSignInScope, string? TestSlice = null);

public sealed class NativeBrokerExecutor(BrokerSettings settings, BrokerChild child, Func<NativeOneAuth?> getAdapter,
    Action<OneAuthInspection>? inspect = null, Action? beginInspection = null, Action<Exception>? inspectError = null) : IBridgeTokenExecutor
{
    public async Task<NativeToken> ExecuteAsync(NativeRequest request, CancellationToken cancellation)
    {
        try { beginInspection?.Invoke(); }
        catch { }
        try
        {
            var configured = settings.Children.SingleOrDefault(candidate => candidate.Number == child.Number);
            if (configured is null || configured.ClientId != child.ClientId || configured.RedirectUri != child.RedirectUri ||
                child.BrokerHostClientId != settings.HostClientId || request.Scopes.Length == 0 ||
                request.Scopes.Any(scope => !configured.Scopes.Contains(scope, StringComparer.OrdinalIgnoreCase)))
                throw new ExecutorException("PERSISTENT_ERROR", "oneauth_child_not_allowed");
            var target = string.Join(" ", request.Scopes.Select(scope => scope.Equals("User.Read", StringComparison.OrdinalIgnoreCase)
                ? "https://graph.microsoft.com/User.Read" : scope));
            var adapter = getAdapter() ?? throw new ExecutorException("PERSISTENT_ERROR", "oneauth_adapter_not_initialized");
            return await adapter.AcquireAsync(settings.Authority, target, configured.ClientId, configured.RedirectUri, request, cancellation, inspect);
        }
        catch (Exception error)
        {
            try { inspectError?.Invoke(error); }
            catch { }
            throw;
        }
    }
}