using System.Reflection;
using System.Text.Json;
using Identity.NativeBridge;
using Identity.NativeBridge.WebView2;
using Microsoft.Web.WebView2.Core;

const string documentUrl = "https://consumer.example/index.html";
var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception(name);
    checks++;
}
NativeExecutorBoundary Boundary(Func<NativeRequest, CancellationToken, Task<NativeToken>>? execute = null) =>
    new("client", "authority", ["User.Read"], execute ?? ((_, _) => Task.FromResult(new NativeToken("access", "id", 3600, "home", "environment"))),
        _ => throw new Exception("diagnostic"), documentUrl);
string Request(string method) => JsonSerializer.Serialize(new
{
    messageType = "NestedAppAuthRequest", requestId = Guid.NewGuid().ToString(), method,
    tokenParams = new { clientId = "client", authority = "authority", scope = "User.Read", correlationId = Guid.NewGuid().ToString() }
});
CancellationTokenSource Lifetime(WebView2Bridge bridge) => (CancellationTokenSource)typeof(WebView2Bridge)
    .GetField("lifetime", BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(bridge)!;
bool IsDisposed(CancellationTokenSource lifetime)
{
    try { _ = lifetime.Token; return false; } catch (ObjectDisposedException) { return true; }
}
var browser = new CoreWebView2();
var bridge = await WebView2Bridge.AttachAsync(browser, Boundary(), _ => throw new Exception("diagnostic"));
Check(!browser.Settings.AreHostObjectsAllowed && browser.HasHandlers, "Binding attaches with host objects disabled");
Check(browser.Navigate("https://evil.example/").Cancel, "Navigation blocked despite throwing diagnostics");
Check(!browser.Navigate(documentUrl).Cancel && browser.Navigate(documentUrl).Cancel, "Only first trusted navigation allowed");
Check(browser.Popup() && browser.Permission() == CoreWebView2PermissionState.Deny, "Popup and permission safeguards");
browser.Receive(Request("GetInitContext"), "https://evil.example/");
Check(browser.Replies.Count == 0, "Untrusted source blocked despite throwing diagnostics");
browser.Receive(Request("GetInitContext"));
using (var reply = JsonDocument.Parse(browser.Replies.Single()))
    Check(reply.RootElement.GetProperty("messageType").GetString() == "NestedAppAuthResponse" &&
        reply.RootElement.GetProperty("success").GetBoolean(), "Direct NAA forwarded and returned");
browser.Source = "https://evil.example/";
browser.Receive(Request("GetToken"), documentUrl);
Check(browser.Replies.Count == 1, "Current document independently verified");
browser.Source = documentUrl;
browser.Receive("{");
Check(browser.Replies.Count == 2, "Malformed request safely handled");
var lifetime = Lifetime(bridge);
bridge.Dispose();
bridge.Dispose();
Check(!browser.HasHandlers && browser.RemovedScripts == 1 && IsDisposed(lifetime), "Idle dispose releases handlers script and lifetime exactly once");
browser.Receive(Request("GetToken"));
Check(browser.Replies.Count == 2, "Disposed binding accepts no messages");

var completion = new TaskCompletionSource<NativeToken>(TaskCreationOptions.RunContinuationsAsynchronously);
CancellationToken executorCancellation = default;
var heldBrowser = new CoreWebView2 { FailRemoval = true };
var heldBridge = await WebView2Bridge.AttachAsync(heldBrowser,
    Boundary((_, token) => { executorCancellation = token; return completion.Task; }), _ => throw new Exception("diagnostic"));
var tracking = new AsyncTrackingContext();
var previousContext = SynchronizationContext.Current;
SynchronizationContext.SetSynchronizationContext(tracking);
try { heldBrowser.Receive(Request("GetToken")); }
finally { SynchronizationContext.SetSynchronizationContext(previousContext); }
var heldLifetime = Lifetime(heldBridge);
heldBridge.Dispose();
Check(executorCancellation.IsCancellationRequested && !IsDisposed(heldLifetime), "Dispose cancels but retains lifetime during outstanding execution");
Check(!heldBrowser.HasHandlers && heldBrowser.RemovedScripts == 1, "Removal failure and diagnostics cannot block detach");
completion.SetResult(new("access", "id", 3600, "home", "environment"));
await tracking.Completed.Task.WaitAsync(TimeSpan.FromSeconds(5));
Check(IsDisposed(heldLifetime) && heldBrowser.Replies.Count == 0, "Drained handler releases lifetime and suppresses late result");
var failedBrowser = new CoreWebView2 { FailInstall = true };
try
{
    using var failedBridge = await WebView2Bridge.AttachAsync(failedBrowser, Boundary(), _ => throw new Exception("diagnostic"));
    throw new Exception("Expected installation failure");
}
catch (InvalidOperationException) { Check(!failedBrowser.HasHandlers, "Failed attachment releases handlers"); }
Console.WriteLine($"PASS: {checks} WebView2 binding assertions (test double; production source).");

sealed class AsyncTrackingContext : SynchronizationContext
{
    private int operations;
    public TaskCompletionSource Completed { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    public override void OperationStarted() => Interlocked.Increment(ref operations);
    public override void OperationCompleted()
    {
        if (Interlocked.Decrement(ref operations) == 0) Completed.SetResult();
    }
    public override void Post(SendOrPostCallback callback, object? state) => ThreadPool.QueueUserWorkItem(_ => callback(state));
}