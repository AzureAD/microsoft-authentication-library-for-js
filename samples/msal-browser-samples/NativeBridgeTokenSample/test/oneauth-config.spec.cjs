const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Windows startup preserves the verified AAD-only configuration and scope semantics", () => {
    const source = fs.readFileSync(path.join(__dirname, "../bridge/adapters/oneauth-webview2-poc/adapter.cpp"), "utf8");
    assert.ok(source.includes('AadConfiguration{UUID::FromString(client_id), redirect_uri, "https://graph.microsoft.com"}'));
    assert.ok(!source.includes("AuthConfiguration{"));
    assert.ok(source.includes('"en", 145, false, *test_slice != \'\\0\''));
    assert.ok(source.includes('additional_parameters.emplace("is_scope_request", "1")'));
    assert.ok(source.includes('if (*test_slice) owner->additional_parameters.emplace("dc", test_slice)'));
    assert.ok(source.includes("RequestOptions::EnableIdSignInUx, RequestOptions::Enabled"));
    assert.ok(source.includes("parameters.SetNestedClientParams(child_client_id, nested_redirect_uri)"));
});