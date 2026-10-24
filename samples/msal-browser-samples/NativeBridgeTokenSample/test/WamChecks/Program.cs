using Identity.NativeBridge;
using Microsoft.Identity.Client;
using NativeBridgeTokenSample;

var first = new TestAccount("first.tenant");
var second = new TestAccount("second.tenant");
IAccount[] accounts = [first, second];

CheckMissingAccount([], "explicit foreign account with empty cache");
CheckMissingAccount(accounts, "explicit foreign account with populated cache");
Check(ReferenceEquals(WamExecutor.SelectAccount(accounts, second.HomeAccountId.Identifier), second),
    "explicit account selects the matching instance among two accounts");
Check(ReferenceEquals(WamExecutor.SelectAccount(accounts, null), first),
    "null request selects the first cached account");
Check(WamExecutor.SelectAccount([], null) is null,
    "null request with empty cache preserves OS-account fallback");

Console.WriteLine("All 5 WAM account-selection checks passed.");

static void CheckMissingAccount(IAccount[] accounts, string scenario)
{
    try
    {
        WamExecutor.SelectAccount(accounts, "foreign.tenant");
    }
    catch (ExecutorException error)
    {
        Check(error.Status == "PERSISTENT_ERROR", $"{scenario}: persistent status");
        Check(error.Code == "native_account_not_found", $"{scenario}: sanitized code");
        Check(error.Message == "native_account_not_found" && error.InnerException is null,
            $"{scenario}: sanitized exception details");
        return;
    }

    throw new InvalidOperationException($"{scenario}: expected explicit-account rejection");
}

static void Check(bool condition, string scenario)
{
    if (!condition) throw new InvalidOperationException($"Failed: {scenario}");
}

sealed class TestAccount(string identifier) : IAccount
{
    public string Username => "test@example.invalid";
    public string Environment => "login.microsoftonline.com";
    public AccountId HomeAccountId { get; } = new(identifier, identifier.Split('.')[0], "tenant");
}