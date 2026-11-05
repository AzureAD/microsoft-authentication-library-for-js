using System.Text.Json;
using System.Text.Json.Nodes;
using Identity.NativeBridge;

const string documentUrl = "https://consumer.example/index.html";

var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception(name);
    Interlocked.Increment(ref checks);
}
NativeToken Token() => new("access", "id", 3600, "home", "environment");
NativeExecutorBoundary Boundary(Func<NativeRequest, CancellationToken, Task<NativeToken>>? execute = null,
    Action<BridgeEvent>? log = null, TimeSpan? timeout = null) => new("client", "authority", ["User.Read"],
        execute ?? ((_, _) => Task.FromResult(Token())), log ?? (_ => { }), documentUrl)
        { RequestTimeout = timeout ?? TimeSpan.FromSeconds(110) };
JsonObject Request(string method = "GetToken", string? requestId = null) => new()
{
    ["messageType"] = "NestedAppAuthRequest", ["requestId"] = requestId ?? Guid.NewGuid().ToString(), ["method"] = method,
    ["tokenParams"] = new JsonObject
    {
        ["clientId"] = "client", ["authority"] = "authority", ["scope"] = "User.Read",
        ["correlationId"] = Guid.NewGuid().ToString()
    }
};
async Task<JsonElement> Send(NativeExecutorBoundary boundary, JsonObject request, CancellationToken cancellation = default,
    string source = documentUrl)
{
    using var reply = JsonDocument.Parse(await boundary.HandleAsync(request.ToJsonString(), source, cancellation));
    Check(reply.RootElement.GetProperty("messageType").GetString() == "NestedAppAuthResponse", "NAA response envelope");
    Check(reply.RootElement.GetProperty("requestId").GetString() == request["requestId"]!.GetValue<string>(), "Request correlation");
    return reply.RootElement.Clone();
}
void Failure(JsonElement reply, string code, string status = "PERSISTENT_ERROR")
{
    Check(!reply.GetProperty("success").GetBoolean(), "Expected failure");
    Check(reply.GetProperty("error").GetProperty("code").GetString() == code, $"Expected error code {code}");
    Check(reply.GetProperty("error").GetProperty("status").GetString() == status, $"Expected error status {status}");
    Check(reply.GetProperty("error").GetProperty("description").GetString() == code, "Safe error description");
}

var calls = 0;
NativeRequest? captured = null;
var boundary = Boundary((request, _) => { calls++; captured = request; return Task.FromResult(Token()); });
var init = await Send(boundary, Request("GetInitContext"));
Check(init.GetProperty("success").GetBoolean() && calls == 0, "Init never invokes executor");
Check(!init.GetProperty("initContext").GetProperty("capabilities").GetProperty("queryAccount").GetBoolean(), "Local init context");
foreach (var method in new[] { "GetToken", "GetTokenPopup" })
{
    var request = Request(method);
    request["tokenParams"]!["claims"] = "claims";
    request["tokenParams"]!["platformBrokerId"] = "account";
    var result = await Send(boundary, request);
    Check(captured!.Interactive == (method == "GetTokenPopup"), "Method controls interactivity");
    Check(captured.Scopes.SequenceEqual(["User.Read"]) && captured.Claims == "claims" && captured.AccountId == "account" &&
        captured.CorrelationId.ToString() == request["tokenParams"]!["correlationId"]!.GetValue<string>(), "Native executor inputs");
    var token = result.GetProperty("token");
    Check(result.GetProperty("success").GetBoolean() && token.GetProperty("access_token").GetString() == "access" &&
        token.GetProperty("id_token").GetString() == "id" && token.GetProperty("expires_in").GetInt32() == 3600 &&
        token.GetProperty("scope").GetString() == "User.Read" && token.GetProperty("authority").GetString() == "authority", "NAA token mapping");
    Check(result.GetProperty("account").GetProperty("homeAccountId").GetString() == "home" &&
        result.GetProperty("account").GetProperty("environment").GetString() == "environment" &&
        !result.TryGetProperty("result", out _), "NAA account mapping without private result wrapper");
    Failure(await Send(boundary, request), "duplicate_or_busy");
}
var scoped = await Send(Boundary((_, _) => Task.FromResult(Token() with { Scope = "user.read" })), Request());
Check(scoped.GetProperty("token").GetProperty("scope").GetString() == "user.read", "Executor-returned scope");
var rejectedCalls = 0;
var guarded = Boundary((_, _) => { rejectedCalls++; return Task.FromResult(Token()); });
foreach (var (field, value, code) in new (string, JsonNode?, string)[]
{
    ("clientId", JsonValue.Create("other"), "client_or_authority_not_allowed"),
    ("authority", JsonValue.Create("other"), "client_or_authority_not_allowed"),
    ("scope", JsonValue.Create("Mail.Read"), "scope_not_allowed"),
    ("scope", JsonValue.Create(""), "scope_not_allowed"),
    ("authenticationScheme", JsonValue.Create("PoP"), "unsupported_authentication_scheme"),
    ("attributeTokens", new JsonObject(), "attribute_tokens_not_supported"),
    ("resource", JsonValue.Create("resource"), "resource_not_supported"),
    ("correlationId", JsonValue.Create("bad"), "invalid_correlation"),
    ("claims", new JsonObject(), "invalid_request_or_executor_failure"),
    ("platformBrokerId", new JsonArray(), "invalid_request_or_executor_failure")
})
{
    var request = Request();
    request["tokenParams"]![field] = value;
    Failure(await Send(guarded, request), code);
}
var wrongWire = Request();
wrongWire["messageType"] = "NativeBridgeExecute";
Failure(await Send(guarded, wrongWire), "invalid_request");
Failure(await Send(guarded, Request("Unknown")), "invalid_request");
var missing = Request();
missing.Remove("tokenParams");
Failure(await Send(guarded, missing), "invalid_request_or_executor_failure");
using (var reply = JsonDocument.Parse(await guarded.HandleAsync(Request("GetInitContext").ToJsonString().PadRight(1_048_576), documentUrl, default)))
    Check(reply.RootElement.GetProperty("success").GetBoolean(), "Package-default character limit accepted");
foreach (var malformed in new[] { "{", "[]", "null", "{}", Request().ToJsonString().PadRight(1_048_577),
    Request(requestId: "not-a-guid").ToJsonString() })
{
    using var reply = JsonDocument.Parse(await guarded.HandleAsync(malformed, documentUrl, default));
    Check(!reply.RootElement.GetProperty("success").GetBoolean(), "Malformed input fails closed");
}
using (var reply = JsonDocument.Parse(await guarded.HandleAsync(Request().ToJsonString(), "https://evil.example/", default)))
    Failure(reply.RootElement, "invalid_request_or_executor_failure");
Check(rejectedCalls == 0, "Rejected requests never reach executor");
foreach (var (token, code) in new[]
{
    (Token() with { AccessToken = "" }, "empty_native_token"),
    (Token() with { IdToken = "" }, "empty_native_token"),
    (Token() with { ExpiresIn = 0 }, "expired_native_token"),
    (Token() with { ExpiresIn = -1 }, "expired_native_token"),
    (Token() with { HomeAccountId = "" }, "invalid_token_result"),
    (Token() with { Environment = "" }, "invalid_token_result")
}) Failure(await Send(Boundary((_, _) => Task.FromResult(token)), Request()), code);
Failure(await Send(Boundary((_, _) => throw new ExecutorException("USER_INTERACTION_REQUIRED", "interaction_required")), Request()),
    "interaction_required", "USER_INTERACTION_REQUIRED");
foreach (var error in new Exception[]
{
    new Exception("SECRET token"), new ExecutorException("SECRET", "interaction_required"),
    new ExecutorException("USER_CANCEL", "SECRET token")
})
{
    var reply = await Send(Boundary((_, _) => throw error, _ => throw new Exception("diagnostic")), Request());
    Failure(reply, "invalid_request_or_executor_failure");
    Check(!reply.ToString().Contains("SECRET"), "Executor details never cross boundary");
}
Check((await Send(Boundary(log: _ => throw new Exception("diagnostic")), Request())).GetProperty("success").GetBoolean(),
    "Throwing success diagnostics isolated");
using (var cancellation = new CancellationTokenSource())
{
    cancellation.Cancel();
    Failure(await Send(boundary, Request("GetInitContext"), cancellation.Token), "cancelled", "USER_CANCEL");
}
var release = new TaskCompletionSource<NativeToken>(TaskCreationOptions.RunContinuationsAsynchronously);
var held = Boundary((_, _) => release.Task);
var heldRequest = Request();
var pending = new List<Task<JsonElement>> { Send(held, heldRequest) };
for (var index = 1; index < 8; index++) pending.Add(Send(held, Request()));
Failure(await Send(held, heldRequest), "duplicate_or_busy");
Failure(await Send(held, Request()), "duplicate_or_busy");
Check((await Send(held, Request("GetInitContext"))).GetProperty("success").GetBoolean(), "Init bypasses full executor capacity");
release.SetResult(Token());
await Task.WhenAll(pending);
Check((await Send(held, Request())).GetProperty("success").GetBoolean(), "Executor capacity released after completion");
using (var cancellation = new CancellationTokenSource())
{
    var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var cancelled = Boundary(async (_, token) => { started.SetResult(); await Task.Delay(Timeout.Infinite, token); return Token(); });
    var request = Request();
    var task = Send(cancelled, request, cancellation.Token);
    await started.Task;
    cancellation.Cancel();
    Failure(await task, "cancelled", "USER_CANCEL");
    Failure(await Send(cancelled, request), "duplicate_or_busy");
    Check((await Send(cancelled, Request("GetInitContext"))).GetProperty("success").GetBoolean(), "Cancellation releases request state");
}
var timed = Boundary(async (_, token) => { await Task.Delay(Timeout.Infinite, token); return Token(); }, timeout: TimeSpan.FromMilliseconds(20));
Failure(await Send(timed, Request()), "native_timeout", "TRANSIENT_ERROR");
Console.WriteLine($"PASS: {checks} native NAA assertions.");