---
generated-by: Forge/Coder
---

# Web Sample Validation

Run `npm test` for protocol, executor, configuration, staging, session and documentation checks. Run `npm run test:browser` with Playwright and Edge for synthetic browser flows. Build the public packages first as described in [README.md](README.md#run).

The tests use fixture accounts and tokens, mocked Graph/authentication and temporary HTTP listeners. HTTPS startup requires explicit certificate/key inputs and owner-approved trust. Tests do not sign in, change registrations, install certificates, or certify live token acquisition.

Validate live host sign-in, each configured child's audience and scopes, silent/interactive behavior, cancellation and Graph access separately with your own authorized test registrations. Keep raw tokens and personal data out of logs, screenshots and shared test output. No private runtime records are included in this sample.