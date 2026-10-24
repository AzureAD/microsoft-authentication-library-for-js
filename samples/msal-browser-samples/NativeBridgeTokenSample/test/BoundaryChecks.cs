using System.Text.Json;
using System.Text.Json.Nodes;
using Identity.NativeBridge;

static class BoundaryChecks
{
    private const string ClientId = "11111111-1111-1111-1111-111111111111";
    private const string Authority = "https://login.microsoftonline.com/organizations";
    private const string Source = "https://bridge-poc.local/index.html";
    private static readonly NativeToken Token = new("ACCESS", "ID", 3600, "home", "login.microsoftonline.com");

    public static async Task Run()
    {
        var calls = 0;
        NativeRequest? received = null;
        var boundary = new NativeExecutorBoundary(ClientId, Authority, ["User.Read"], (request, _) =>
        {
            calls++;
            received = request;
            return Task.FromResult(Token);
        }, _ => { }, Source);

        async Task Reject(JsonObject request, string code)
        {
            var before = calls;
            using var response = JsonDocument.Parse(await boundary.HandleAsync(request.ToJsonString(), Source, default));
            var root = response.RootElement;
            Check(!root.GetProperty("success").GetBoolean() &&
                root.GetProperty("messageType").GetString() == "NestedAppAuthResponse" &&
                root.GetProperty("error").GetProperty("code").GetString() == code &&
                root.GetProperty("error").GetProperty("description").GetString() == code && calls == before,
                $"reject {code} before executor");
        }

        foreach (var value in new[] { "\"Unknown\"", "1", "null", "{}", "[]" })
        {
            var request = Request();
            request["method"] = JsonNode.Parse(value);
            await Reject(request, value.StartsWith('"') || value == "null" ? "invalid_request" : "invalid_request_or_executor_failure");
        }
        var missingMethod = Request();
        missingMethod.Remove("method");
        await Reject(missingMethod, "invalid_request_or_executor_failure");
        foreach (var (property, value, code) in new[]
        {
            ("authenticationScheme", "\"PoP\"", "unsupported_authentication_scheme"),
            ("authenticationScheme", "null", "unsupported_authentication_scheme"),
            ("attributeTokens", "{}", "attribute_tokens_not_supported"),
            ("attributeTokens", "[]", "attribute_tokens_not_supported"),
            ("resource", "\"https://graph.microsoft.com\"", "resource_not_supported"),
            ("scope", "\"\"", "scope_not_allowed"),
            ("scope", "\"User.Read Mail.Read\"", "scope_not_allowed"),
            ("correlationId", "\"not-a-guid\"", "invalid_correlation")
        })
        {
            var request = Request();
            request["tokenParams"]![property] = JsonNode.Parse(value);
            await Reject(request, code);
        }
        var invalidId = Request();
        invalidId["requestId"] = "not-a-guid";
        await Reject(invalidId, "invalid_request");
        var maximumMessage = Request().ToJsonString().PadRight(1_048_576);
        using (var maximum = JsonDocument.Parse(await boundary.HandleAsync(maximumMessage, Source, default)))
            Check(maximum.RootElement.GetProperty("success").GetBoolean() && calls == 1,
                "1,048,576-character message accepted by executor");
        using (var oversized = JsonDocument.Parse(await boundary.HandleAsync(Request().ToJsonString().PadRight(1_048_577), Source, default)))
            Check(oversized.RootElement.GetProperty("error").GetProperty("code").GetString() == "invalid_request_or_executor_failure" && calls == 1,
                "1,048,577-character message rejected before executor");

        var forwarded = Request();
        forwarded["method"] = "GetTokenPopup";
        forwarded["tokenParams"]!["claims"] = "{\"access_token\":{}}";
        forwarded["tokenParams"]!["platformBrokerId"] = "selected-account";
        forwarded["tokenParams"]!["resource"] = null;
        forwarded["tokenParams"]!["attributeTokens"] = null;
        using (var response = JsonDocument.Parse(await boundary.HandleAsync(forwarded.ToJsonString(), Source, default)))
            Check(response.RootElement.GetProperty("success").GetBoolean() && received is { Interactive: true, AccountId: "selected-account" } &&
                received.Claims == "{\"access_token\":{}}" && received.Scopes.SequenceEqual(new[] { "User.Read" }) &&
                received.CorrelationId.ToString() == forwarded["tokenParams"]!["correlationId"]!.GetValue<string>(),
                "NAA method controls executor; claims, account, correlation and scopes forwarded");
            forwarded["requestId"] = Guid.Parse(forwarded["requestId"]!.GetValue<string>()).ToString("D").ToUpperInvariant();
        await Reject(forwarded, "duplicate_or_busy");

        using (var cancellation = new CancellationTokenSource())
        {
            cancellation.Cancel();
            var before = calls;
            using var response = JsonDocument.Parse(await boundary.HandleAsync(Request().ToJsonString(), Source, cancellation.Token));
            Check(response.RootElement.GetProperty("error").GetProperty("status").GetString() == "USER_CANCEL" && calls == before,
                "pre-cancelled request never starts native work");
        }

        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var concurrentCalls = 0;
        var concurrent = new NativeExecutorBoundary(ClientId, Authority, ["User.Read"], async (_, cancellation) =>
        {
            concurrentCalls++;
            await release.Task.WaitAsync(cancellation);
            return Token;
        }, _ => { }, Source);
        var first = Request().ToJsonString();
        var pending = new List<Task<string>> { concurrent.HandleAsync(first, Source, default) };
        try
        {
            using var duplicate = JsonDocument.Parse(await concurrent.HandleAsync(first, Source, default));
            Check(!duplicate.RootElement.GetProperty("success").GetBoolean() && concurrentCalls == 1, "active replay rejected");
            for (var index = 1; index < 8; index++) pending.Add(concurrent.HandleAsync(Request().ToJsonString(), Source, default));
            using var busy = JsonDocument.Parse(await concurrent.HandleAsync(Request().ToJsonString(), Source, default));
            Check(busy.RootElement.GetProperty("error").GetProperty("code").GetString() == "duplicate_or_busy" && concurrentCalls == 8,
                "eight-operation native resource cap enforced");
        }
        finally
        {
            release.TrySetResult();
            await Task.WhenAll(pending);
        }
        foreach (var invalid in new[] { Token with { AccessToken = "" }, Token with { IdToken = "" } })
        {
            var invalidBoundary = new NativeExecutorBoundary(ClientId, Authority, ["User.Read"], (_, _) => Task.FromResult(invalid), _ => { }, Source);
            using var response = JsonDocument.Parse(await invalidBoundary.HandleAsync(Request().ToJsonString(), Source, default));
            Check(response.RootElement.GetProperty("error").GetProperty("code").GetString() == "empty_native_token", "empty native credentials rejected");
        }
    }

    private static JsonObject Request() => new()
    {
        ["messageType"] = "NestedAppAuthRequest", ["requestId"] = Guid.NewGuid().ToString(), ["method"] = "GetToken",
        ["tokenParams"] = new JsonObject
        {
            ["clientId"] = ClientId, ["authority"] = Authority, ["scope"] = "User.Read",
            ["correlationId"] = Guid.NewGuid().ToString(), ["authenticationScheme"] = "Bearer"
        }
    };

    private static void Check(bool condition, string name)
    {
        if (!condition) throw new Exception($"FAIL: {name}");
        Console.WriteLine($"PASS: {name}");
    }
}