# Client capability in MSAL

**Client capability** is meant to inform the Microsoft identity platform *Security Token Service* (STS) what a client is capable of, so STS can decide to turn on certain features. For example, if the client is capable to handle claims challenges, STS can then issue *Continuous Access Evaluation* (CAE) enabled access tokens to resources, knowing when the resource emits a claims challenge, the client will be capable to handle it.

MSAL supports clients to declare their capabilities via the `clientCapabilities` property in the configuration object that is used during MSAL instantiation. For more details, see:

- msal-browser [configuration](../../msal-browser/docs/configuration.md#auth-config-options)
- msal-node [configuration](../../msal-node/docs/configuration.md#auth-config-options)

See also: [Handling a claims challenge with MSAL](./claims-challenge.md)

## Samples

- [VanillaJS](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/client-capabilities)