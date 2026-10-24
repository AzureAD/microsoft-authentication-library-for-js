namespace Microsoft.Web.WebView2.Core;

public sealed class CoreWebView2Settings
{
    public bool AreHostObjectsAllowed { get; set; } = true;
}
public sealed class CoreWebView2NavigationStartingEventArgs(string uri) : EventArgs
{
    public string Uri { get; } = uri;
    public bool Cancel { get; set; }
}
public sealed class CoreWebView2NewWindowRequestedEventArgs : EventArgs
{
    public bool Handled { get; set; }
}
public enum CoreWebView2PermissionState { Default, Deny }
public sealed class CoreWebView2PermissionRequestedEventArgs : EventArgs
{
    public CoreWebView2PermissionState State { get; set; }
}
public sealed class CoreWebView2WebMessageReceivedEventArgs(string message, string source) : EventArgs
{
    public string Source { get; } = source;
    public string TryGetWebMessageAsString() => message;
}
public sealed class CoreWebView2
{
    public CoreWebView2Settings Settings { get; } = new();
    public string Source { get; set; } = "https://consumer.example/index.html";
    public bool FailInstall { get; init; }
    public bool FailRemoval { get; init; }
    public int RemovedScripts { get; private set; }
    public string? Script { get; private set; }
    public List<string> Replies { get; } = [];
    public event EventHandler<CoreWebView2NavigationStartingEventArgs>? NavigationStarting;
    public event EventHandler<CoreWebView2NewWindowRequestedEventArgs>? NewWindowRequested;
    public event EventHandler<CoreWebView2PermissionRequestedEventArgs>? PermissionRequested;
    public event EventHandler<CoreWebView2WebMessageReceivedEventArgs>? WebMessageReceived;
    public bool HasHandlers => NavigationStarting is not null || NewWindowRequested is not null ||
        PermissionRequested is not null || WebMessageReceived is not null;
    public Task<string> AddScriptToExecuteOnDocumentCreatedAsync(string script)
    {
        Script = script;
        return FailInstall ? Task.FromException<string>(new InvalidOperationException("install")) : Task.FromResult("script");
    }
    public void RemoveScriptToExecuteOnDocumentCreated(string scriptId)
    {
        RemovedScripts++;
        if (FailRemoval) throw new InvalidOperationException("remove");
    }
    public void PostWebMessageAsString(string message) => Replies.Add(message);
    public void Receive(string message, string? source = null) =>
        WebMessageReceived?.Invoke(this, new(message, source ?? Source));
    public CoreWebView2NavigationStartingEventArgs Navigate(string uri)
    {
        var args = new CoreWebView2NavigationStartingEventArgs(uri);
        NavigationStarting?.Invoke(this, args);
        return args;
    }
    public bool Popup()
    {
        var args = new CoreWebView2NewWindowRequestedEventArgs();
        NewWindowRequested?.Invoke(this, args);
        return args.Handled;
    }
    public CoreWebView2PermissionState Permission()
    {
        var args = new CoreWebView2PermissionRequestedEventArgs();
        PermissionRequested?.Invoke(this, args);
        return args.State;
    }
}