using System.Runtime.InteropServices;

namespace Identity.NativeBridge.OneAuthPoc;

public sealed record OneAuthStartup(string ApplicationId, string ClientId, string RedirectUri, string DefaultScope, long Window, string TestSlice);

public sealed record OneAuthInvocation(OneAuthStartup Startup, string Authority, string Target, string ChildClientId,
    string NestedRedirectUri, string Claims, string CorrelationId, string AccountId, int Acquire, int Interactive)
{
    public string Boundary => "Managed poc_acquire arguments and source-defined adapter mapping; not wire HTTP or an SDK-internal snapshot";
    public string SdkMethod => Acquire != 0
        ? Interactive != 0 ? "AcquireCredentialInteractively" : "AcquireCredentialSilently"
        : Interactive != 0 ? "SignInInteractively" : "SignInSilently";
    public object AdapterMapping => new
    {
        authority = Authority, target = Acquire != 0 ? Target : Startup.DefaultScope,
        claims = Acquire != 0 ? Claims : "", authenticationScheme = "Bearer",
        nestedClient = Acquire != 0 ? new { clientId = ChildClientId, redirectUri = NestedRedirectUri } : null,
        additionalParameters = string.IsNullOrEmpty(Startup.TestSlice)
            ? new Dictionary<string, string> { ["is_scope_request"] = "1" }
            : new Dictionary<string, string> { ["is_scope_request"] = "1", ["dc"] = Startup.TestSlice },
        correlationId = CorrelationId, isTestMode = !string.IsNullOrEmpty(Startup.TestSlice),
        enableIdSignInUx = Acquire == 0 && Interactive != 0,
        accountSelection = Acquire != 0 ? "Native session account; AccountId is validated by the adapter" : "Host bootstrap"
    };
}

public sealed record OneAuthInspection(OneAuthInvocation Request, string State, NativeToken? Response = null, object? Error = null);

public sealed record OneAuthInitializationRequest(string ApplicationId, string ClientId, string RedirectUri,
    string DefaultScope, bool ParentWindowProvided, string TestSlice)
{
    public string Boundary => "Managed poc_start_v2 arguments; not NAA GetInitContext or wire HTTP";
    public string SdkMethod => "OneAuth::Startup, GetAuthenticator, CreateUxContext";
    public object SourceDefinedConfiguration => new
    {
        source = "adapter.cpp poc_start_v2 and public Windows SDK configuration declarations; not a runtime SDK snapshot",
        appConfiguration = new { applicationId = ApplicationId, appName = "MSAL Native Bridge POC", appVersion = "0.1.0",
            languageCode = "en", hrdApplicationId = 145, supportsAdfs = false, isTestMode = !string.IsNullOrEmpty(TestSlice) },
        aadConfiguration = new { clientId = ClientId, redirectUri = RedirectUri, defaultSignInResource = "https://graph.microsoft.com" },
        omittedConfigurations = new[] { "Msa", "Auth", "OnPremises", "Telemetry" },
        sdkDefaultsNotPassedByAdapter = new { capabilities = Array.Empty<string>(), allowSameRealmAccount = true },
        startupOptions = "Windows Startup(configuration) overload; no separate options argument",
        uxContext = new { parentWindowProvided = ParentWindowProvided, customFactory = false, title = "MSAL Native Bridge POC" },
        acquisitionSessionSettings = new { defaultScope = DefaultScope, additionalParameters = string.IsNullOrEmpty(TestSlice)
            ? new Dictionary<string, string> { ["is_scope_request"] = "1" }
            : new Dictionary<string, string> { ["is_scope_request"] = "1", ["dc"] = TestSlice } }
    };
}

public sealed record OneAuthInitializationResult(int Status, bool AdapterCreated)
{
    public string Boundary => "poc_start_v2 return status and non-null session flag; not a raw Startup Error or AuthResult";
}

public sealed record OneAuthInitializationInspection(OneAuthInitializationRequest? Request, string State,
    OneAuthInitializationResult? Response = null, object? Error = null);

// Only for NativeBridgeTokenSample's Windows WPF/WebView2 NAA POC; not a reusable OneAuth binding.
public sealed class NativeOneAuth : IAsyncDisposable
{
    private const string Library = "OneAuthWebView2Poc";
    private readonly SemaphoreSlim gate = new(1, 1);
    private static readonly Completion callback = Complete;
    private readonly SynchronizationContext ui = SynchronizationContext.Current
        ?? throw new InvalidOperationException("Create the POC adapter on the WPF UI dispatcher.");
    private readonly int uiThread = System.Environment.CurrentManagedThreadId;
    private IntPtr session;
    private bool disposed;
    private bool signedIn;
    private Task? shutdown;
    private readonly OneAuthStartup startup;

    public NativeOneAuth(string applicationId, string clientId, string redirectUri, string defaultScope, IntPtr window, string? testSlice = null,
        Action<OneAuthInitializationInspection>? inspectInitialization = null)
    {
        var request = new OneAuthInitializationRequest(applicationId, clientId, redirectUri, defaultScope, window != IntPtr.Zero, testSlice ?? "");
        int? status = null;
        Publish(new(request, "pending"));
        try
        {
            if (string.IsNullOrWhiteSpace(applicationId) || !Guid.TryParse(clientId, out var client) || client == Guid.Empty ||
                !Uri.TryCreate(redirectUri, UriKind.Absolute, out _) || string.IsNullOrWhiteSpace(defaultScope) || window == IntPtr.Zero)
                throw new ArgumentException("Explicit host configuration and a parent window are required.");
            if (testSlice is not null && (testSlice.Length > 128 || testSlice.Length == 0 ||
                testSlice.Any(character => !char.IsAsciiLetterOrDigit(character) && character != '-')))
                throw new ArgumentException("TestSlice must be an alphanumeric scale-unit name with optional hyphens.");
            startup = new(applicationId, clientId, redirectUri, defaultScope, window.ToInt64(), testSlice ?? "");
            status = Start(startup.ApplicationId, startup.ClientId, startup.RedirectUri, startup.DefaultScope,
                new IntPtr(startup.Window), startup.TestSlice, out session);
            ThrowIfError(status.Value);
            if (session == IntPtr.Zero) throw new ExecutorException("PERSISTENT_ERROR", "oneauth_native_failure");
            Publish(new(request, "completed", new(status.Value, true)));
        }
        catch (Exception error)
        {
            Publish(new(request, "failed", status.HasValue ? new(status.Value, session != IntPtr.Zero) : null,
                error is ExecutorException executorError
                    ? new { type = error.GetType().Name, executorError.Status, executorError.Code }
                    : (object)new { type = error.GetType().Name }));
            throw;
        }

        void Publish(OneAuthInitializationInspection snapshot)
        {
            try { inspectInitialization?.Invoke(snapshot); }
            catch { }
        }
    }

    public async Task<NativeToken> AcquireAsync(string authority, string target, string childClientId,
        string nestedRedirectUri, NativeRequest request, CancellationToken cancellation, Action<OneAuthInspection>? inspect = null)
    {
        VerifyUiThread();
        await gate.WaitAsync(cancellation);
        try
        {
            ObjectDisposedException.ThrowIf(disposed, this);
            var finished = false;
            using var registration = cancellation.Register(() => ui.Post(_ =>
            {
                if (!finished) Cancel(session, request.CorrelationId.ToString());
            }, null));
            try
            {
                if (!signedIn) { await Stage(false); signedIn = true; }
                return await Stage(true) ?? throw new ExecutorException("PERSISTENT_ERROR", "oneauth_token_missing");
            }
            finally { finished = true; }

            async Task<NativeToken?> Stage(bool acquire)
            {
                try { return await Invoke(acquire, false); }
                catch (ExecutorException error) when (request.Interactive && error.Code == "oneauth_interaction_required")
                {
                    cancellation.ThrowIfCancellationRequested();
                    return await Invoke(acquire, true);
                }
            }

            async Task<NativeToken?> Invoke(bool acquire, bool interactive)
            {
                var invocation = new OneAuthInvocation(startup, authority, target, childClientId, nestedRedirectUri,
                    request.Claims ?? "", request.CorrelationId.ToString(), request.AccountId ?? "", acquire ? 1 : 0, interactive ? 1 : 0);
                Publish(new(invocation, "pending"));
                try
                {
                    var result = await InvokeNative(invocation);
                    Publish(new(invocation, "completed", result));
                    return result;
                }
                catch (Exception error)
                {
                    Publish(new(invocation, "failed", Error: error is ExecutorException executorError
                        ? new { type = error.GetType().Name, executorError.Status, executorError.Code }
                        : (object)new { type = error.GetType().Name }));
                    throw;
                }
            }

            void Publish(OneAuthInspection snapshot)
            {
                try { inspect?.Invoke(snapshot); }
                catch { }
            }

            async Task<NativeToken?> InvokeNative(OneAuthInvocation invocation)
            {
                ObjectDisposedException.ThrowIf(disposed, this);
                cancellation.ThrowIfCancellationRequested();
                var completion = new TaskCompletionSource<NativeToken?>(TaskCreationOptions.RunContinuationsAsynchronously);
                var context = GCHandle.Alloc(new Pending(invocation.Acquire != 0, completion));
                int status;
                try
                {
                    status = Acquire(session, invocation.Authority, invocation.Target, invocation.ChildClientId, invocation.NestedRedirectUri, invocation.Claims,
                        invocation.CorrelationId, invocation.AccountId, invocation.Acquire, invocation.Interactive,
                        callback, GCHandle.ToIntPtr(context));
                }
                catch { context.Free(); throw; }
                if (status != 0) { context.Free(); ThrowIfError(status); }
                try
                {
                    var token = await completion.Task;
                    ObjectDisposedException.ThrowIf(disposed, this);
                    cancellation.ThrowIfCancellationRequested();
                    return token;
                }
                finally { Cancel(session, request.CorrelationId.ToString()); }
            }
        }
        finally { gate.Release(); }
    }

    public ValueTask DisposeAsync()
    {
        VerifyUiThread();
        return new(shutdown ??= StopAsync());
    }

    private void VerifyUiThread()
    {
        if (System.Environment.CurrentManagedThreadId != uiThread)
            throw new InvalidOperationException("Call the POC adapter on its WPF UI dispatcher.");
    }

    private async Task StopAsync()
    {
        disposed = true;
        if (gate.CurrentCount == 0) Cancel(session, Guid.NewGuid().ToString());
        await gate.WaitAsync();
        try
        {
            Stop(session);
            session = IntPtr.Zero;
        }
        finally { gate.Release(); }
    }

    [StructLayout(LayoutKind.Sequential)]
    internal record struct TokenResult
    {
        public IntPtr AccessToken, IdToken, Scope, HomeAccountId, Environment;
        public int ExpiresIn;
    }

    internal static NativeToken ReadResult(int status, TokenResult result)
    {
        ThrowIfError(status);
        var access = Read(result.AccessToken);
        var id = Read(result.IdToken);
        if (string.IsNullOrEmpty(access) || string.IsNullOrEmpty(id))
            throw new ExecutorException("PERSISTENT_ERROR", "oneauth_token_missing");
        if (result.ExpiresIn <= 0) throw new ExecutorException("PERSISTENT_ERROR", "oneauth_token_expired");
        return new(access, id, result.ExpiresIn, Read(result.HomeAccountId), Read(result.Environment), Read(result.Scope));
    }

    private static string Read(IntPtr value) => Marshal.PtrToStringUTF8(value) ?? "";

    private sealed record Pending(bool Acquire, TaskCompletionSource<NativeToken?> Completion);

    private static void ThrowIfError(int status)
    {
        if (status == 0) return;
        throw status switch
        {
            2 => new ExecutorException("USER_INTERACTION_REQUIRED", "oneauth_interaction_required"),
            7 or 8 => new ExecutorException("USER_CANCEL", "oneauth_cancelled"),
            _ => new ExecutorException("PERSISTENT_ERROR", "oneauth_native_failure"),
        };
    }

    private static void Complete(int status, in TokenResult result, IntPtr context)
    {
        var handle = GCHandle.FromIntPtr(context);
        var pending = (Pending)handle.Target!;
        try
        {
            ThrowIfError(status);
            pending.Completion.TrySetResult(pending.Acquire ? ReadResult(status, result) : null);
        }
        catch (Exception error) { pending.Completion.TrySetException(error); }
        finally { handle.Free(); }
    }

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    private delegate void Completion(int status, in TokenResult result, IntPtr context);

    [DllImport(Library, EntryPoint = "poc_start_v2", CallingConvention = CallingConvention.Cdecl)]
    private static extern int Start([MarshalAs(UnmanagedType.LPUTF8Str)] string applicationId,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string clientId, [MarshalAs(UnmanagedType.LPUTF8Str)] string redirectUri,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string defaultScope, IntPtr window,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string testSlice, out IntPtr session);

    [DllImport(Library, EntryPoint = "poc_acquire", CallingConvention = CallingConvention.Cdecl)]
    private static extern int Acquire(IntPtr session, [MarshalAs(UnmanagedType.LPUTF8Str)] string authority,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string target, [MarshalAs(UnmanagedType.LPUTF8Str)] string childClientId,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string nestedRedirectUri, [MarshalAs(UnmanagedType.LPUTF8Str)] string claims,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string correlationId, [MarshalAs(UnmanagedType.LPUTF8Str)] string accountId,
        int acquire, int interactive, Completion completion, IntPtr context);

    [DllImport(Library, EntryPoint = "poc_stop", CallingConvention = CallingConvention.Cdecl)]
    private static extern void Stop(IntPtr session);

    [DllImport(Library, EntryPoint = "poc_cancel", CallingConvention = CallingConvention.Cdecl)]
    private static extern void Cancel(IntPtr session, [MarshalAs(UnmanagedType.LPUTF8Str)] string correlationId);
}