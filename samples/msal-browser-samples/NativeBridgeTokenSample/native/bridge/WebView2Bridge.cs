using Microsoft.Web.WebView2.Core;

namespace Identity.NativeBridge.WebView2;

public sealed class WebView2Bridge : IDisposable
{
    private readonly CoreWebView2 browser;
    private readonly NativeExecutorBoundary protocol;
    private readonly Action<BridgeEvent> log;
    private readonly CancellationTokenSource lifetime = new();
    private string? scriptId;
    private bool disposed;
    private bool navigationStarted;
    private int lifetimeReferences = 1;

    private WebView2Bridge(CoreWebView2 browser, NativeExecutorBoundary protocol, Action<BridgeEvent> log)
    {
        this.browser = browser;
        this.protocol = protocol;
        this.log = log;
    }

    public static async Task<WebView2Bridge> AttachAsync(CoreWebView2 browser, NativeExecutorBoundary protocol, Action<BridgeEvent> log)
    {
        var bridge = new WebView2Bridge(browser, protocol, log);
        browser.Settings.AreHostObjectsAllowed = false;
        browser.NavigationStarting += bridge.NavigationStarting;
        browser.NewWindowRequested += bridge.NewWindowRequested;
        browser.PermissionRequested += bridge.PermissionRequested;
        browser.WebMessageReceived += bridge.WebMessageReceived;
        try
        {
            bridge.scriptId = await browser.AddScriptToExecuteOnDocumentCreatedAsync(BridgeScript.Create(protocol.TrustedDocumentUrl));
            return bridge;
        }
        catch
        {
            bridge.Dispose();
            throw;
        }
    }

    private void NavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs args)
    {
        if (navigationStarted || args.Uri != protocol.TrustedDocumentUrl)
        {
            args.Cancel = true;
            Emit(new("host", "navigation_blocked"));
            return;
        }
        navigationStarted = true;
    }

    private void NewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs args)
    {
        args.Handled = true;
        Emit(new("host", "popup_blocked"));
    }

    private void PermissionRequested(object? sender, CoreWebView2PermissionRequestedEventArgs args) => args.State = CoreWebView2PermissionState.Deny;

    private async void WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        if (disposed) return;
        Interlocked.Increment(ref lifetimeReferences);
        try
        {
            if (disposed || args.Source != protocol.TrustedDocumentUrl || browser.Source != protocol.TrustedDocumentUrl)
            {
                Emit(new("host", "untrusted_message_blocked"));
                return;
            }
            var message = args.TryGetWebMessageAsString();
            var reply = await protocol.HandleAsync(message, args.Source, lifetime.Token);
            if (!disposed && browser.Source == protocol.TrustedDocumentUrl) browser.PostWebMessageAsString(reply);
        }
        catch (Exception error)
        {
            Emit(new("host", "transport_failed", Code: error.GetType().Name));
        }
        finally { ReleaseLifetime(); }
    }

    private void Emit(BridgeEvent entry)
    {
        try { log(entry); } catch { }
    }

    private void ReleaseLifetime()
    {
        if (Interlocked.Decrement(ref lifetimeReferences) == 0) lifetime.Dispose();
    }

    private void Cleanup(Action action)
    {
        try { action(); }
        catch (Exception error) { Emit(new("host", "cleanup_failed", Code: error.GetType().Name)); }
    }

    public void Dispose()
    {
        if (disposed) return;
        disposed = true;
        Cleanup(() => lifetime.Cancel());
        Cleanup(() => browser.NavigationStarting -= NavigationStarting);
        Cleanup(() => browser.NewWindowRequested -= NewWindowRequested);
        Cleanup(() => browser.PermissionRequested -= PermissionRequested);
        Cleanup(() => browser.WebMessageReceived -= WebMessageReceived);
        if (scriptId is not null) Cleanup(() => browser.RemoveScriptToExecuteOnDocumentCreated(scriptId));
        ReleaseLifetime();
    }
}