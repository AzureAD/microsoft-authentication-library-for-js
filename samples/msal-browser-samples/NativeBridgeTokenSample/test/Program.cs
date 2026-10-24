using System.Text.Json;
using Identity.NativeBridge;
using NativeBridgeTokenSample;

var broker = BrokerSettings.Placeholders();
broker.Validate();
if (broker.Children.Length != 2 || broker.Children.Select(child => child.ClientId).Distinct().Count() != 2 || broker.Children.Any(child => child.ClientId == broker.HostClientId))
    throw new Exception("Active broker demo requires exactly two children distinct from the host.");
foreach (var invalid in new[]
{
    broker with { Children = broker.Children.Select(child => child with { ClientId = broker.HostClientId }).ToArray() },
    broker with { Children = broker.Children.Select(child => child with { BrokerHostClientId = "99999999-9999-9999-9999-999999999999" }).ToArray() },
    broker with { Children = broker.Children.Select(child => child with { RedirectUri = "brk-multihub://evil.example" }).ToArray() },
})
{
    try { invalid.Validate(); throw new Exception("Unsafe broker configuration accepted."); }
    catch (ArgumentException) { }
}
Console.WriteLine("PASS: separate host/children, explicit host binding, and child redirect validation.");
foreach (var child in broker.Children)
{
    var childCalls = 0;
    var childProtocol = new NativeExecutorBoundary(child.ClientId, broker.Authority, child.Scopes, (_, _) =>
    {
        childCalls++;
        return Task.FromResult(new NativeToken($"child-{child.Number}", $"id-{child.Number}", 3600, "home", "login.microsoftonline.com", "User.Read"));
    }, _ => { }, child.PageUrl);
    foreach (var foreign in broker.Children.Where(candidate => candidate.Number != child.Number))
    {
        var foreignRequest = JsonSerializer.Serialize(new { messageType = "NestedAppAuthRequest", requestId = Guid.NewGuid().ToString(), method = "GetToken", tokenParams = new { clientId = foreign.ClientId, authority = broker.Authority, scope = "User.Read", correlationId = Guid.NewGuid().ToString(), authenticationScheme = "Bearer" } });
        using var rejectedClient = JsonDocument.Parse(await childProtocol.HandleAsync(foreignRequest, child.PageUrl, CancellationToken.None));
        using var rejectedOrigin = JsonDocument.Parse(await childProtocol.HandleAsync(foreignRequest, foreign.PageUrl, CancellationToken.None));
        if (rejectedClient.RootElement.GetProperty("success").GetBoolean() || rejectedOrigin.RootElement.GetProperty("success").GetBoolean())
            throw new Exception("Sibling identity/origin accepted.");
    }
    if (childCalls != 0) throw new Exception("Rejected sibling request reached executor.");
    var ownRequest = JsonSerializer.Serialize(new { messageType = "NestedAppAuthRequest", requestId = Guid.NewGuid().ToString(), method = "GetToken", tokenParams = new { clientId = child.ClientId, authority = broker.Authority, scope = "User.Read", correlationId = Guid.NewGuid().ToString(), authenticationScheme = "Bearer" } });
    using var ownResult = JsonDocument.Parse(await childProtocol.HandleAsync(ownRequest, child.PageUrl, CancellationToken.None));
    if (childCalls != 1 || ownResult.RootElement.GetProperty("token").GetProperty("access_token").GetString() != $"child-{child.Number}")
        throw new Exception("Child response mapping mismatch.");
}
Console.WriteLine("PASS: both child bindings reject sibling client IDs and origins and map their own fake result.");

const string clientId = "11111111-1111-1111-1111-111111111111";
const string authority = "https://login.microsoftonline.com/organizations";
const string source = "https://bridge-poc.local/index.html";
var calls = 0;
var events = new List<BridgeEvent>();
var protocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], async (request, cancellation) =>
{
    calls++;
    await Task.CompletedTask;
    return new NativeToken("SECRET", "ID-TOKEN", 3600, "home", "login.microsoftonline.com", "User.Read");
}, events.Add, source);

string Message(bool interactive = false, string requestedClient = clientId, string requestedAuthority = authority, string scope = "User.Read") =>
    JsonSerializer.Serialize(new
    {
        messageType = "NestedAppAuthRequest", requestId = Guid.NewGuid().ToString(), method = interactive ? "GetTokenPopup" : "GetToken",
        tokenParams = new { clientId = requestedClient, authority = requestedAuthority, scope, correlationId = Guid.NewGuid().ToString(), authenticationScheme = "Bearer" }
    });

void Check(bool condition, string name)
{
    if (!condition) throw new Exception($"FAIL: {name}");
    Console.WriteLine($"PASS: {name}");
}

async Task<JsonElement> Send(string message, string origin = source)
{
    using var document = JsonDocument.Parse(await protocol.HandleAsync(message, origin, CancellationToken.None));
    return document.RootElement.Clone();
}

var initMessage = JsonSerializer.Serialize(new { messageType = "NestedAppAuthRequest", requestId = Guid.NewGuid().ToString(), method = "GetInitContext" });
var init = await Send(initMessage);
Check(init.GetProperty("success").GetBoolean() && init.GetProperty("initContext").GetProperty("capabilities").GetProperty("queryAccount").GetBoolean() == false,
    "native initialization returns original NAA context");
Check(calls == 0, "NAA initialization never acquires a token");
var tokenMessage = Message(true);
var token = await Send(tokenMessage);
Check(token.GetProperty("messageType").GetString() == "NestedAppAuthResponse", "NAA response discriminator");
Check(token.GetProperty("token").GetProperty("access_token").GetString() == "SECRET", "native result uses original NAA token shape");
Check(token.GetProperty("account").GetProperty("environment").GetString() == "login.microsoftonline.com", "native environment preserved");
Check(!token.TryGetProperty("result", out _) && !token.TryGetProperty("initContext", out _), "token response has no internal result envelope");
using var sent = JsonDocument.Parse(tokenMessage);
Check(token.GetProperty("requestId").GetString() == sent.RootElement.GetProperty("requestId").GetString(), "request ID echoed");
Check(!JsonSerializer.Serialize(events).Contains("SECRET"), "logs exclude tokens");
Check(!(await Send(Message(), "https://evil.example/index.html")).GetProperty("success").GetBoolean(), "untrusted source rejected");
Check(!(await Send(Message(requestedClient: "22222222-2222-2222-2222-222222222222"))).GetProperty("success").GetBoolean(), "foreign client rejected");
Check(!(await Send(Message(requestedAuthority: "https://evil.example/tenant"))).GetProperty("success").GetBoolean(), "foreign authority rejected");
Check(!(await Send(Message(scope: "Mail.Read"))).GetProperty("success").GetBoolean(), "unapproved scope rejected");
Check(!(await Send("not-json")).GetProperty("success").GetBoolean(), "malformed input rejected");
Check(calls == 1, "rejected requests never reach executor");
Check(!(await Send(tokenMessage)).GetProperty("success").GetBoolean(), "completed request replay rejected");
var silentProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], (_, _) =>
    throw new ExecutorException("USER_INTERACTION_REQUIRED", "interaction_required"), events.Add, source);
using var silent = JsonDocument.Parse(await silentProtocol.HandleAsync(Message(), source, CancellationToken.None));
Check(silent.RootElement.GetProperty("error").GetProperty("status").GetString() == "USER_INTERACTION_REQUIRED", "silent interaction-required status preserved");
const string consumerUrl = "https://consumer.example/auth/index.html";
var consumerProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], (_, _) =>
    Task.FromResult(new NativeToken("CONSUMER", "ID", 3600, "home", "login.microsoftonline.com")), events.Add, consumerUrl);
using var consumerResult = JsonDocument.Parse(await consumerProtocol.HandleAsync(Message(), consumerUrl, CancellationToken.None));
Check(consumerResult.RootElement.GetProperty("success").GetBoolean(), "consumer-defined trusted document accepted");
using var sampleRejected = JsonDocument.Parse(await consumerProtocol.HandleAsync(Message(), source, CancellationToken.None));
Check(!sampleRejected.RootElement.GetProperty("success").GetBoolean(), "sample document not implicitly trusted");
var injection = BridgeScript.Create(consumerUrl);
Check(injection.Contains("NestedAppAuthBridge") && injection.Contains("window.top === window") && injection.Contains(consumerUrl), "auto-install bundle embedded with exact top-document guard");
Check(injection == BridgeScript.Create(consumerUrl, consumerProtocol.ConfigurationJson), "compatibility overload ignores host configuration");
Check(!injection.Contains(clientId) && !injection.Contains("allowedScopes"), "host configuration stays native");
try
{
    BridgeScript.Create("http://consumer.example/index.html", consumerProtocol.ConfigurationJson);
    throw new Exception("FAIL: insecure trusted document accepted");
}
catch (ArgumentException)
{
    Check(true, "insecure trusted document rejected");
}
Console.WriteLine("Native protocol checks passed.");

var hostExecutor = new TestHostExecutor();
var interfaceProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], hostExecutor, events.Add, source);
using var hostCancellation = new CancellationTokenSource();
foreach (var interactive in new[] { false, true })
{
    using var response = JsonDocument.Parse(await interfaceProtocol.HandleAsync(Message(interactive), source, hostCancellation.Token));
    Check(response.RootElement.GetProperty("success").GetBoolean(), "host interface result returned");
    Check(hostExecutor.LastRequest?.Interactive == interactive, "host interface receives interaction mode");
}
using var rejectedInterfaceRequest = JsonDocument.Parse(await interfaceProtocol.HandleAsync(Message(scope: "Mail.Read"), source, hostCancellation.Token));
Check(hostExecutor.Calls == 2, "invalid request never reaches host interface");
Check(hostExecutor.Cancellation.CanBeCanceled, "host interface receives cancellable operation");
hostExecutor.WaitForCancellation = true;
var pendingHostRequest = interfaceProtocol.HandleAsync(Message(), source, hostCancellation.Token);
hostCancellation.Cancel();
using var cancelledHostResponse = JsonDocument.Parse(await pendingHostRequest);
Check(hostExecutor.Cancellation.IsCancellationRequested, "host cancellation reaches executor");
Check(!cancelledHostResponse.RootElement.GetProperty("success").GetBoolean(), "cancelled host request cannot return success");

var minimalToken = new NativeToken("MINIMAL-ACCESS", "MINIMAL-ID", 3600, "oneauth-home", "login.microsoftonline.com");
var minimalProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], (_, _) => Task.FromResult(minimalToken), events.Add, source);
using var minimalResponse = JsonDocument.Parse(await minimalProtocol.HandleAsync(Message(), source, CancellationToken.None));
var minimalRoot = minimalResponse.RootElement;
Check(minimalRoot.GetProperty("success").GetBoolean(), "five-field host result accepted");
Check(minimalRoot.GetProperty("account").GetProperty("homeAccountId").GetString() == "oneauth-home", "host account identity preserved");
Check(!minimalRoot.GetProperty("account").TryGetProperty("localAccountId", out _) &&
    !minimalRoot.GetProperty("account").TryGetProperty("tenantId", out _) &&
    !minimalRoot.GetProperty("account").TryGetProperty("username", out _), "claim-derived account fields left to MSAL.js");
Check(minimalRoot.GetProperty("token").GetProperty("scope").GetString() == "User.Read", "omitted native scope falls back to request in NAA response");
var grantedProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], (_, _) => Task.FromResult(minimalToken with { Scope = "https://graph.microsoft.com/User.Read" }), events.Add, source);
using var grantedResponse = JsonDocument.Parse(await grantedProtocol.HandleAsync(Message(), source, CancellationToken.None));
Check(grantedResponse.RootElement.GetProperty("token").GetProperty("scope").GetString() == "https://graph.microsoft.com/User.Read", "explicit granted scopes preserved");

foreach (var lifetime in new[] { 0, -1 })
{
    var expiredProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"],
        (_, _) => Task.FromResult(minimalToken with { ExpiresIn = lifetime }), events.Add, source);
    using var expired = JsonDocument.Parse(await expiredProtocol.HandleAsync(Message(), source, CancellationToken.None));
    Check(!expired.RootElement.GetProperty("success").GetBoolean() &&
        expired.RootElement.GetProperty("error").GetProperty("code").GetString() == "expired_native_token", "expired host result rejected");
}

var replayCalls = 0;
var rolloverProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], (_, _) =>
{
    replayCalls++;
    return Task.FromResult(minimalToken);
}, _ => { }, source);
var oldestInit = Message();
await rolloverProtocol.HandleAsync(oldestInit, source, CancellationToken.None);
for (var index = 0; index < 1022; index++)
    await rolloverProtocol.HandleAsync(Message(), source, CancellationToken.None);
var recentToken = Message();
await rolloverProtocol.HandleAsync(recentToken, source, CancellationToken.None);
await rolloverProtocol.HandleAsync(Message(), source, CancellationToken.None);
using var replayAfterRollover = JsonDocument.Parse(await rolloverProtocol.HandleAsync(recentToken, source, CancellationToken.None));
Check(!replayAfterRollover.RootElement.GetProperty("success").GetBoolean() && replayCalls == 1025,
    "replay rollover retains recent completed requests");
using var evictedInit = JsonDocument.Parse(await rolloverProtocol.HandleAsync(oldestInit, source, CancellationToken.None));
Check(evictedInit.RootElement.GetProperty("success").GetBoolean(), "replay history evicts only oldest requests");

Check(cancelledHostResponse.RootElement.GetProperty("error").GetProperty("status").GetString() == "USER_CANCEL",
    "explicit caller cancellation remains user cancellation");
foreach (var nativeCancellation in new[] { false, true })
{
    var timeoutProtocol = new NativeExecutorBoundary(clientId, authority, ["User.Read"], async (_, cancellation) =>
    {
        try { await Task.Delay(Timeout.Infinite, cancellation); }
        catch (OperationCanceledException) when (nativeCancellation)
        {
            throw new ExecutorException("USER_CANCEL", "oneauth_cancelled");
        }
        return minimalToken;
    }, _ => { }, source) { RequestTimeout = TimeSpan.FromMilliseconds(20) };
    using var timedOut = JsonDocument.Parse(await timeoutProtocol.HandleAsync(Message(), source, CancellationToken.None));
    Check(timedOut.RootElement.GetProperty("error").GetProperty("status").GetString() == "TRANSIENT_ERROR" &&
        timedOut.RootElement.GetProperty("error").GetProperty("code").GetString() == "native_timeout",
        "bridge deadline is not user cancellation");
}

await BoundaryChecks.Run();

sealed class TestHostExecutor : IBridgeTokenExecutor
{
    public int Calls { get; private set; }
    public NativeRequest? LastRequest { get; private set; }
    public CancellationToken Cancellation { get; private set; }
    public bool WaitForCancellation { get; set; }

    public async Task<NativeToken> ExecuteAsync(NativeRequest request, CancellationToken cancellation)
    {
        Calls++;
        LastRequest = request;
        Cancellation = cancellation;
        if (WaitForCancellation) await Task.Delay(Timeout.Infinite, cancellation);
        return new NativeToken("HOST-TOKEN", "HOST-ID", 3600, "home", "login.microsoftonline.com", "User.Read");
    }
}