# MSAL Node documentation

[All MSAL.js documentation](../../../docs/README.md) | [Package overview and installation](../README.md) | [FAQ](./faq.md)

Use MSAL Node for server-side applications, desktop applications, and CLIs. Choose a public client when the application cannot protect credentials, or a confidential client for trusted server-side code.

## Get started

- [Register an application and collect configuration values](./app-registration.md).
- Initialize a [public client](./initialize-public-client-application.md) or [confidential client](./initialize-confidential-client-application.md).
- Review [configuration](./configuration.md) and select the [token acquisition API](./request.md).
- Understand [accounts](./accounts.md), [token caching](./caching.md), and the [interactive loopback server](./loopback-server.md).

## Credentials and workload identity

- [Certificate credentials](./certificate-credentials.md) and [subject name/issuer authentication](./sni.md).
- [Managed identity](./managed-identity.md) and [Key Vault with managed identity](./key-vault-managed-identity.md).
- [Regional authorities](./regional-authorities.md).

## Native broker and persistent cache

- [Broker overview and Windows setup](./brokering.md).
- [Linux broker installation and dependencies](./brokering.md#linux).
- [macOS broker configuration](./brokering.md#macos).
- [Node extensions and cache persistence](../../../extensions/docs/README.md).

## Advanced scenarios and troubleshooting

- [Attribute tokens](./attribute-tokens.md) and [MCP authorization](./mcp.md).
- [Performance](./performance.md), [FAQ](./faq.md), and the [shared error catalog](../../../docs/errors.md).
- Shared [authority configuration](../../msal-common/docs/authority.md), [multi-tenant accounts](../../msal-common/docs/multi-tenant-accounts.md), and [claims challenges](../../msal-common/docs/claims-challenge.md).

## Migrations

- [MSAL Node 2.x to 3.x](./v2-migration.md).
- [MSAL Node 3.x to 5.x](./v5-migration.md).
- [MSAL Node 5.x to 6.x](./v6-migration.md).
- [MSAL Node 6.x to 7.x](./v7-migration.md).

Check each guide's version scope before using historical code examples.
