using Identity.NativeBridge;
using Microsoft.Identity.Client;
using Microsoft.Identity.Client.Broker;

namespace NativeBridgeTokenSample;

public sealed class WamExecutor : IBridgeTokenExecutor
{
    private readonly IPublicClientApplication application;
    private readonly Action<BridgeEvent> log;
    private readonly SemaphoreSlim gate = new(1, 1);

    public WamExecutor(string clientId, string authority, Func<IntPtr> windowHandle, Action<BridgeEvent> log)
    {
        this.log = log;
        application = PublicClientApplicationBuilder.Create(clientId)
            .WithAuthority(authority)
            .WithDefaultRedirectUri()
            .WithParentActivityOrWindow(windowHandle)
            .WithBroker(new BrokerOptions(BrokerOptions.OperatingSystems.Windows) { Title = "Native Bridge POC" })
            .Build();
    }

    public async Task<NativeToken> ExecuteAsync(NativeRequest request, CancellationToken cancellation)
    {
        if (!await gate.WaitAsync(0, cancellation)) throw new ExecutorException("TRANSIENT_ERROR", "native_executor_busy");
        try
        {
            var accounts = (await application.GetAccountsAsync()).ToArray();
            var account = SelectAccount(accounts, request.AccountId);
            AuthenticationResult result;
            try
            {
                log(new("wam", "silent_start", CorrelationId: request.CorrelationId.ToString()));
                result = await application.AcquireTokenSilent(request.Scopes, account ?? PublicClientApplication.OperatingSystemAccount)
                    .WithCorrelationId(request.CorrelationId).WithClaims(request.Claims).ExecuteAsync(cancellation);
            }
            catch (MsalUiRequiredException) when (request.Interactive)
            {
                log(new("wam", "interactive_start", CorrelationId: request.CorrelationId.ToString()));
                result = await application.AcquireTokenInteractive(request.Scopes).WithAccount(account)
                    .WithCorrelationId(request.CorrelationId).WithClaims(request.Claims).ExecuteAsync(cancellation);
            }
            var tokenSource = result.AuthenticationResultMetadata.TokenSource.ToString();
            log(new("wam", "token_received", CorrelationId: request.CorrelationId.ToString(), TokenSource: tokenSource));
            return new(result.AccessToken, result.IdToken,
                Math.Max(0, (int)(result.ExpiresOn - DateTimeOffset.UtcNow).TotalSeconds),
                result.Account.HomeAccountId.Identifier, result.Account.Environment, string.Join(" ", result.Scopes));
        }
        catch (MsalUiRequiredException error)
        {
            throw new ExecutorException("USER_INTERACTION_REQUIRED", error.ErrorCode);
        }
        catch (MsalException error)
        {
            throw new ExecutorException(error.ErrorCode == "authentication_canceled" ? "USER_CANCEL" : "PERSISTENT_ERROR", error.ErrorCode);
        }
        finally
        {
            gate.Release();
        }
    }

    internal static IAccount? SelectAccount(IAccount[] accounts, string? requestedAccountId)
    {
        if (requestedAccountId is null) return accounts.FirstOrDefault();
        return accounts.FirstOrDefault(candidate => candidate.HomeAccountId.Identifier == requestedAccountId)
            ?? throw new ExecutorException("PERSISTENT_ERROR", "native_account_not_found");
    }
}