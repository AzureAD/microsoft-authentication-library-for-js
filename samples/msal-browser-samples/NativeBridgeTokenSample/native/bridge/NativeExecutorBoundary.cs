using System.Text.Json;

namespace Identity.NativeBridge;

public record NativeRequest(bool Interactive, string[] Scopes, Guid CorrelationId, string? Claims, string? AccountId);
public record NativeToken(string AccessToken, string IdToken, int ExpiresIn, string HomeAccountId,
    string Environment, string? Scope = null);
public record BridgeEvent(string Layer, string Event, string? RequestId = null, string? CorrelationId = null,
    string? Method = null, long? ElapsedMs = null, string? Code = null, string? TokenSource = null);
public sealed class ExecutorException(string status, string code) : Exception(code)
{
    public string Status { get; } = status;
    public string Code { get; } = code;
}

public sealed class NativeExecutorBoundary(string clientId, string authority, string[] allowedScopes,
    Func<NativeRequest, CancellationToken, Task<NativeToken>> execute, Action<BridgeEvent> log, string trustedDocumentUrl)
{
    public NativeExecutorBoundary(string clientId, string authority, string[] allowedScopes,
        IBridgeTokenExecutor executor, Action<BridgeEvent> log, string trustedDocumentUrl)
        : this(clientId, authority, allowedScopes,
            (executor ?? throw new ArgumentNullException(nameof(executor))).ExecuteAsync, log, trustedDocumentUrl)
    {
    }

    public string TrustedDocumentUrl { get; } = BridgeScript.ValidateDocumentUrl(trustedDocumentUrl);
    public string ConfigurationJson { get; } = JsonSerializer.Serialize(new
    {
        clientId, authority, allowedScopes, sdkName = "Identity.WindowsBridge.POC", sdkVersion = "0.1.0"
    });
    internal TimeSpan RequestTimeout { get; init; } = TimeSpan.FromSeconds(110);
    private readonly HashSet<string> active = [];
    private readonly HashSet<string> completed = [];
    private readonly Queue<string> completionOrder = new();
    private static readonly HashSet<string> SafeStatuses = ["USER_INTERACTION_REQUIRED", "USER_CANCEL", "ACCOUNT_UNAVAILABLE",
        "NO_NETWORK", "TRANSIENT_ERROR", "PERSISTENT_ERROR", "NESTED_APP_AUTH_UNAVAILABLE"];
    private static readonly HashSet<string> SafeCodes = ["interaction_required", "cancelled", "native_timeout", "empty_native_token",
        "expired_native_token", "invalid_token_result", "oneauth_interaction_required", "oneauth_cancelled", "oneauth_native_failure",
        "oneauth_token_missing", "oneauth_token_expired", "oneauth_child_not_allowed", "oneauth_adapter_not_initialized",
        "invalid_request_or_executor_failure", "client_or_authority_not_allowed", "scope_not_allowed", "invalid_correlation",
        "unsupported_authentication_scheme", "attribute_tokens_not_supported", "resource_not_supported", "duplicate_or_busy", "invalid_request"];

    private void Emit(BridgeEvent entry)
    {
        try { log(entry); } catch { }
    }

    public async Task<string> HandleAsync(string message, string source, CancellationToken cancellation)
    {
        string? requestId = null;
        string? replayId = null;
        string? correlationId = null;
        string? method = null;
        var registered = false;
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            if (source != TrustedDocumentUrl || message.Length > 1_048_576) throw new ExecutorException("PERSISTENT_ERROR", "untrusted_source_or_size");
            using var document = JsonDocument.Parse(message);
            var root = document.RootElement;
            var candidateId = root.GetProperty("requestId").GetString();
            if (!Guid.TryParseExact(candidateId, "D", out var requestGuid))
                throw new ExecutorException("PERSISTENT_ERROR", "invalid_request");
            requestId = candidateId;
            if (root.GetProperty("messageType").GetString() != "NestedAppAuthRequest")
                throw new ExecutorException("PERSISTENT_ERROR", "invalid_request");
            method = root.GetProperty("method").GetString();
            if (method is not ("GetInitContext" or "GetToken" or "GetTokenPopup"))
                throw new ExecutorException("PERSISTENT_ERROR", "invalid_request");
            replayId = requestGuid.ToString();
            var interactive = method == "GetTokenPopup";
            cancellation.ThrowIfCancellationRequested();
            lock (active)
            {
                if ((method != "GetInitContext" && active.Count >= 8) || active.Contains(replayId) || completed.Contains(replayId))
                    throw new ExecutorException("PERSISTENT_ERROR", "duplicate_or_busy");
                active.Add(replayId);
                registered = true;
            }
            if (method == "GetInitContext")
                return JsonSerializer.Serialize(new
                {
                    messageType = "NestedAppAuthResponse", requestId, success = true,
                    initContext = new { sdkName = "Identity.WindowsBridge.POC", sdkVersion = "0.1.0", capabilities = new { queryAccount = false } }
                });
            var parameters = root.GetProperty("tokenParams");
            if (parameters.GetProperty("clientId").GetString() != clientId || parameters.GetProperty("authority").GetString() != authority)
                throw new ExecutorException("PERSISTENT_ERROR", "client_or_authority_not_allowed");
            var scopes = (parameters.GetProperty("scope").GetString() ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (scopes.Length == 0 || scopes.Any(scope => !allowedScopes.Contains(scope, StringComparer.OrdinalIgnoreCase)))
                throw new ExecutorException("PERSISTENT_ERROR", "scope_not_allowed");
            if (parameters.TryGetProperty("authenticationScheme", out var scheme) && scheme.GetString() != "Bearer")
                throw new ExecutorException("PERSISTENT_ERROR", "unsupported_authentication_scheme");
            if (parameters.TryGetProperty("attributeTokens", out var attributes) && attributes.ValueKind is not JsonValueKind.Null)
                throw new ExecutorException("PERSISTENT_ERROR", "attribute_tokens_not_supported");
            if (parameters.TryGetProperty("resource", out var resource) && resource.ValueKind is not JsonValueKind.Null)
                throw new ExecutorException("PERSISTENT_ERROR", "resource_not_supported");
            correlationId = parameters.GetProperty("correlationId").GetString();
            if (!Guid.TryParseExact(correlationId, "D", out var correlation)) throw new ExecutorException("PERSISTENT_ERROR", "invalid_correlation");
            string? claims = parameters.TryGetProperty("claims", out var claimValue) ? claimValue.GetString() : null;
            string? accountId = parameters.TryGetProperty("platformBrokerId", out var accountValue) ? accountValue.GetString() : null;
            Emit(new("native", "executor_start", requestId, correlationId, Method: method));
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellation);
            timeout.CancelAfter(RequestTimeout);
            NativeToken result;
            try
            {
                timeout.Token.ThrowIfCancellationRequested();
                result = await execute(new(interactive, scopes, correlation, claims, accountId), timeout.Token);
                timeout.Token.ThrowIfCancellationRequested();
            }
            catch (Exception error) when (!cancellation.IsCancellationRequested && timeout.IsCancellationRequested &&
                (error is OperationCanceledException || error is ExecutorException { Status: "USER_CANCEL" }))
            {
                throw new ExecutorException("TRANSIENT_ERROR", "native_timeout");
            }
            if (string.IsNullOrEmpty(result.AccessToken) || string.IsNullOrEmpty(result.IdToken))
                throw new ExecutorException("PERSISTENT_ERROR", "empty_native_token");
            if (result.ExpiresIn <= 0)
                throw new ExecutorException("PERSISTENT_ERROR", "expired_native_token");
            if (string.IsNullOrEmpty(result.HomeAccountId) || string.IsNullOrEmpty(result.Environment))
                throw new ExecutorException("PERSISTENT_ERROR", "invalid_token_result");
            Emit(new("native", "executor_success", requestId, correlationId, Method: method, ElapsedMs: stopwatch.ElapsedMilliseconds));
            return JsonSerializer.Serialize(new
            {
                messageType = "NestedAppAuthResponse", requestId, success = true,
                token = new { access_token = result.AccessToken, id_token = result.IdToken, expires_in = result.ExpiresIn,
                    scope = string.IsNullOrEmpty(result.Scope) ? parameters.GetProperty("scope").GetString() : result.Scope, authority },
                account = new { homeAccountId = result.HomeAccountId, environment = result.Environment }
            });
        }
        catch (Exception error)
        {
            var status = error is ExecutorException executor ? executor.Status : error is OperationCanceledException ? "USER_CANCEL" : "PERSISTENT_ERROR";
            var code = error is ExecutorException failure ? failure.Code : error is OperationCanceledException ? "cancelled" : "invalid_request_or_executor_failure";
            if (!SafeStatuses.Contains(status) || !SafeCodes.Contains(code))
            {
                status = "PERSISTENT_ERROR";
                code = "invalid_request_or_executor_failure";
            }
            Emit(new("native", "request_failed", requestId, correlationId, Method: method, ElapsedMs: stopwatch.ElapsedMilliseconds, Code: code));
            return JsonSerializer.Serialize(new { messageType = "NestedAppAuthResponse", requestId, success = false, error = new { status, code, description = code } });
        }
        finally
        {
            if (registered)
            {
                lock (active)
                {
                    active.Remove(replayId!);
                    completed.Add(replayId!);
                    completionOrder.Enqueue(replayId!);
                    if (completionOrder.Count > 1024) completed.Remove(completionOrder.Dequeue());
                }
            }
        }
    }
}