using System.Runtime.InteropServices;
using Identity.NativeBridge;
using Identity.NativeBridge.OneAuthPoc;
using System.Windows.Threading;
using NativeBridgeTokenSample;
using System.Text.Json;

var syntheticStartup = new OneAuthStartup("test-app", "host-client", "msauth://host", "host-scope", 1, "TEST-SLICE");
foreach (var acquire in new[] { 0, 1 })
foreach (var interactive in new[] { 0, 1 })
{
    var invocation = new OneAuthInvocation(syntheticStartup, "https://example.test", "child-scope", "child-client",
        "brk-multihub://child", "synthetic-claims", "test-correlation", "test-account", acquire, interactive);
    var syntheticToken = new NativeToken("SYNTHETIC_ACCESS_TOKEN", "SYNTHETIC_ID_TOKEN", 3600, "test-home", "test-environment", "test-scope");
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(new OneAuthInspection(invocation, "completed", syntheticToken)));
    var captured = json.RootElement;
    if (captured.GetProperty("Response").Deserialize<NativeToken>() != syntheticToken ||
        captured.GetProperty("Request").GetProperty("Startup").Deserialize<OneAuthStartup>() != syntheticStartup ||
        captured.GetProperty("Request").GetProperty("Claims").GetString() != "synthetic-claims" ||
        captured.GetProperty("Request").GetProperty("AdapterMapping").GetProperty("target").GetString() != (acquire == 0 ? "host-scope" : "child-scope") ||
        captured.GetProperty("Request").GetProperty("AdapterMapping").GetProperty("additionalParameters").GetProperty("dc").GetString() != "TEST-SLICE")
        throw new Exception("Inspection serialization omitted or changed invocation/result fields.");
}
Console.WriteLine("PASS: full synthetic native invocation/response serialization, startup settings, and bootstrap/child mapping.");
var initializationRequest = new OneAuthInitializationRequest("test-app", "host-client", "msauth://host", "host-scope", true, "TEST-SLICE");
foreach (var status in new[] { 0, -1, 6 })
{
    var snapshot = new OneAuthInitializationInspection(initializationRequest, status == 0 ? "completed" : "failed", new(status, status == 0));
    using var captured = JsonDocument.Parse(JsonSerializer.Serialize(snapshot));
    var root = captured.RootElement;
    var mapping = root.GetProperty("Request").GetProperty("SourceDefinedConfiguration");
    if (root.GetProperty("Request").GetProperty("ParentWindowProvided").GetBoolean() != true ||
        root.GetProperty("Request").TryGetProperty("Window", out _) ||
        root.GetProperty("Response").GetProperty("Status").GetInt32() != status ||
        root.GetProperty("Response").GetProperty("AdapterCreated").GetBoolean() != (status == 0) ||
        !mapping.GetProperty("appConfiguration").GetProperty("isTestMode").GetBoolean() ||
        mapping.GetProperty("appConfiguration").GetProperty("hrdApplicationId").GetInt32() != 145 ||
        mapping.GetProperty("sdkDefaultsNotPassedByAdapter").GetProperty("capabilities").GetArrayLength() != 0 ||
        mapping.GetProperty("acquisitionSessionSettings").GetProperty("additionalParameters").GetProperty("dc").GetString() != "TEST-SLICE")
        throw new Exception("Initialization inspection changed status, omitted settings, or exposed a pointer.");
}
Console.WriteLine("PASS: synthetic initialization request/result, native status, pointer omission, and source-defined options/capabilities.");
var unavailableBroker = BrokerSettings.Placeholders();
Exception? observedFailure = null;
var unavailableExecutor = new NativeBrokerExecutor(unavailableBroker, unavailableBroker.Children[0], () => null,
    beginInspection: () => throw new InvalidOperationException("synthetic observer failure"),
    inspectError: error => observedFailure = error);
await ExpectAsync(() => unavailableExecutor.ExecuteAsync(new NativeRequest(false, ["User.Read"], Guid.NewGuid(), null, null), default),
    "oneauth_adapter_not_initialized");
if (observedFailure is not ExecutorException { Code: "oneauth_adapter_not_initialized" })
    throw new Exception("Executor boundary error was not observed.");
Console.WriteLine("PASS: pre-initialization errors remain observable and inspection cannot change execution.");

var access = Marshal.StringToCoTaskMemUTF8("test-access-token");
var id = Marshal.StringToCoTaskMemUTF8("test-child-id-token");
try
{
    var result = new NativeOneAuth.TokenResult { AccessToken = access, IdToken = id, ExpiresIn = 3600 };
    var token = NativeOneAuth.ReadResult(0, result);
    if (token.AccessToken != "test-access-token" || token.IdToken != "test-child-id-token")
        throw new Exception("Adapter altered or lost a token.");
    Expect(() => NativeOneAuth.ReadResult(0, result with { IdToken = IntPtr.Zero }), "oneauth_token_missing");
    Expect(() => NativeOneAuth.ReadResult(0, result with { AccessToken = IntPtr.Zero }), "oneauth_token_missing");
    Expect(() => NativeOneAuth.ReadResult(0, result with { ExpiresIn = 0 }), "oneauth_token_expired");
    Expect(() => NativeOneAuth.ReadResult(2, result), "oneauth_interaction_required");
    Expect(() => NativeOneAuth.ReadResult(7, result), "oneauth_cancelled");
    Expect(() => NativeOneAuth.ReadResult(8, result), "oneauth_cancelled");
    Expect(() => NativeOneAuth.ReadResult(-1, result), "oneauth_native_failure");
    Console.WriteLine("PASS: exact ID/access-token mapping, required tokens, expiry, and sanitized errors.");
}
finally
{
    Marshal.FreeCoTaskMem(access);
    Marshal.FreeCoTaskMem(id);
}

if (args.Contains("--native-fixture"))
{
    var done = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var thread = new Thread(() =>
    {
        SynchronizationContext.SetSynchronizationContext(new DispatcherSynchronizationContext());
        Dispatcher.CurrentDispatcher.BeginInvoke(async () =>
        {
            try
            {
                var initializationSnapshots = new List<OneAuthInitializationInspection>();
                try
                {
                    _ = new NativeOneAuth("test-slice", Guid.NewGuid().ToString(), "msauth://test", "User.Read", new IntPtr(1),
                        inspectInitialization: initializationSnapshots.Add);
                    throw new Exception("Synthetic create failure was accepted.");
                }
                catch (ExecutorException error) when (error.Code == "oneauth_native_failure") { }
                if (initializationSnapshots.Count != 2 || initializationSnapshots[0].State != "pending" ||
                    initializationSnapshots[1] is not { State: "failed", Response: { Status: -1, AdapterCreated: false }, Error: not null })
                    throw new Exception("Native create failure lost the actual status or request/error snapshot.");
                initializationSnapshots.Clear();
                await using (var retryAdapter = new NativeOneAuth("test", Guid.NewGuid().ToString(), "msauth://test", "User.Read", new IntPtr(1),
                    inspectInitialization: initializationSnapshots.Add))
                {
                    if (initializationSnapshots.Count != 2 || initializationSnapshots[0].State != "pending" ||
                        initializationSnapshots[1] is not { State: "completed", Response: { Status: 0, AdapterCreated: true }, Error: null } ||
                        !ReferenceEquals(initializationSnapshots[0].Request, initializationSnapshots[1].Request))
                        throw new Exception("Native create success lost initialization arguments or actual result.");
                    var retryBroker = BrokerSettings.Placeholders();
                    retryBroker.Validate();
                    var inspections = new List<OneAuthInspection>();
                    var starts = 0;
                    var retryChild = new NativeBrokerExecutor(retryBroker, retryBroker.Children[0], () => retryAdapter,
                        inspections.Add, () => starts++);
                    var retryRequest = new NativeRequest(true, ["User.Read"], Guid.Parse("44444444-4444-4444-4444-444444444444"), "bootstrap-unexpected", "home");
                    await ExpectAsync(() => retryChild.ExecuteAsync(retryRequest, CancellationToken.None), "oneauth_native_failure");
                    var retriedToken = await retryChild.ExecuteAsync(retryRequest with { Claims = "inline-success" }, CancellationToken.None);
                    if (retriedToken.AccessToken != "test-access-token" || retriedToken.IdToken != "test-child-id-token" ||
                        retriedToken.HomeAccountId != "home" || retriedToken.Environment != "login.microsoftonline.com" ||
                        retriedToken.Scope != "User.Read" || retriedToken.ExpiresIn != 3600)
                        throw new Exception("Bootstrap retry or inline callback lost token or account fields.");
                    var inlineRequest = retryRequest with { Claims = "inline-interaction-required" };
                    await ExpectAsync(() => retryChild.ExecuteAsync(inlineRequest with { Interactive = false }, CancellationToken.None), "oneauth_interaction_required");
                    var interactiveToken = await retryChild.ExecuteAsync(inlineRequest, CancellationToken.None);
                    if (interactiveToken.AccessToken != "test-access-token" || interactiveToken.IdToken != "test-child-id-token")
                        throw new Exception("Inline interaction-required retry lost tokens.");
                    if (starts != 4 || !inspections.Any(item => item.Request.Acquire == 0 && item.State == "failed") ||
                        !inspections.Any(item => item.Request.Acquire == 0 && item.State == "completed" && item.Response is null) ||
                        !inspections.Any(item => item.Request.Acquire == 1 && item.Request.Interactive == 0 && item.State == "failed") ||
                        !inspections.Any(item => item.Request.Acquire == 1 && item.Request.Interactive == 1 && item.Response == interactiveToken))
                        throw new Exception("Inspection lost bootstrap, retry, failure, or full result stages.");
                    foreach (var snapshot in inspections.Where(item => item.Response is not null))
                    {
                        using var captured = JsonDocument.Parse(JsonSerializer.Serialize(snapshot));
                        if (captured.RootElement.GetProperty("Response").Deserialize<NativeToken>() != snapshot.Response ||
                            snapshot.Request.ChildClientId != retryBroker.Children[0].ClientId ||
                            snapshot.Request.NestedRedirectUri != retryBroker.Children[0].RedirectUri ||
                            snapshot.Request.CorrelationId != retryRequest.CorrelationId.ToString())
                            throw new Exception("Observed native call or response does not match the executor.");
                    }
                    var observerFailure = new NativeBrokerExecutor(retryBroker, retryBroker.Children[0], () => retryAdapter,
                        _ => throw new InvalidOperationException("synthetic observer failure"));
                    if (await observerFailure.ExecuteAsync(retryRequest with { Claims = "inline-success" }, CancellationToken.None) != retriedToken)
                        throw new Exception("Inspection failure changed the native result.");
                    Console.WriteLine("PASS: observed native bootstrap/child stages, silent/interactive errors, complete response serialization, and observer isolation.");
                    Console.WriteLine("PASS: Unexpected bootstrap failure, unpoisoned successful retry, inline success, and inline interaction-required callbacks.");
                    if (initializationSnapshots.Count != 2)
                        throw new Exception("Acquisition changed constructor inspection.");
                    Console.WriteLine("PASS: actual fixture create success/failure status, request/result capture, and initialization retained through acquisition.");
                }
                await using var adapter = new NativeOneAuth("test-slice", Guid.NewGuid().ToString(), "msauth://test", "User.Read", new IntPtr(1),
                    testSlice: "synthetic-test-slice", inspectInitialization: _ => throw new InvalidOperationException("synthetic observer failure"));
                var broker = BrokerSettings.Placeholders();
                broker.Validate();
                var child1 = new NativeBrokerExecutor(broker, broker.Children[0], () => adapter);
                var child2 = new NativeBrokerExecutor(broker, broker.Children[1], () => adapter);
                var request = new NativeRequest(true, ["User.Read"], Guid.Parse("44444444-4444-4444-4444-444444444444"), "{}", "home");
                await ExpectAsync(() => child1.ExecuteAsync(request with { Interactive = false }, CancellationToken.None), "oneauth_interaction_required");
                var token = await child1.ExecuteAsync(request, CancellationToken.None);
                if (token.IdToken != "test-child-id-token" || token.HomeAccountId != "home" ||
                    token.Environment != "login.microsoftonline.com" || token.Scope != "User.Read" || token.ExpiresIn != 3600)
                    throw new Exception("Native callback lost token or account fields.");
                await child2.ExecuteAsync(request, CancellationToken.None);
                await ExpectAsync(() => child1.ExecuteAsync(request with { Interactive = false }, CancellationToken.None), "oneauth_interaction_required");
                await ExpectAsync(() => child1.ExecuteAsync(request with { AccountId = "foreign" }, CancellationToken.None), "oneauth_native_failure");
                await ExpectAsync(() => child1.ExecuteAsync(request with { Scopes = ["Mail.Read"] }, CancellationToken.None), "oneauth_child_not_allowed");
                var substituted = new NativeBrokerExecutor(broker, broker.Children[0] with { ClientId = broker.Children[1].ClientId }, () => adapter);
                await ExpectAsync(() => substituted.ExecuteAsync(request, CancellationToken.None), "oneauth_child_not_allowed");
                var wrongRedirect = new NativeBrokerExecutor(broker, broker.Children[0] with { RedirectUri = broker.Children[1].RedirectUri }, () => adapter);
                await ExpectAsync(() => wrongRedirect.ExecuteAsync(request, CancellationToken.None), "oneauth_child_not_allowed");
                using var cancellation = new CancellationTokenSource();
                var pending = child1.ExecuteAsync(request with { Claims = "wait-cancel" }, cancellation.Token);
                var queued = child2.ExecuteAsync(request, CancellationToken.None);
                if (queued.IsCompleted) throw new Exception("A queued child bypassed the active native operation.");
                cancellation.Cancel();
                try { await pending; throw new Exception("Cancellation was ignored."); }
                catch (ExecutorException error) when (error.Code == "oneauth_cancelled") { }
                catch (OperationCanceledException) { }
                await queued;
                var interrupted = child1.ExecuteAsync(request with { Claims = "dispose-after-completion" }, CancellationToken.None);
                var shutdown = adapter.DisposeAsync();
                try { await interrupted; throw new Exception("A new stage ran after disposal began."); }
                catch (ObjectDisposedException) { }
                await shutdown;
                await adapter.DisposeAsync();
                Console.WriteLine("PASS: native ABI, child parameter forwarding, account/child rejection, silent/UI policy, shared bootstrap, serialized requests, cancellation, drain, and idempotent shutdown.");
                done.SetResult();
            }
            catch (Exception error) { done.SetException(error); }
            finally { Dispatcher.CurrentDispatcher.InvokeShutdown(); }
        });
        Dispatcher.Run();
    });
    thread.SetApartmentState(ApartmentState.STA);
    thread.Start();
    await done.Task;
    thread.Join();
}

static void Expect(Action action, string code)
{
    try { action(); }
    catch (ExecutorException error) when (error.Code == code) { return; }
    throw new Exception($"Expected {code}.");
}

static async Task ExpectAsync(Func<Task<NativeToken>> action, string code)
{
    try { await action(); }
    catch (ExecutorException error) when (error.Code == code) { return; }
    throw new Exception($"Expected {code}.");
}