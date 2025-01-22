# Migrating from MSAL Node v2 to MSAL v3

If you are new to MSAL Node, you should start [here for public clients](initialize-public-client-application.md) or [here for confidential clients](initialize-confidential-client-application.md).

If you are coming from MSAL Node v2, you can follow this guide to update your code to use MSAL Node v3.

## Breaking Changes

### NodeStorage is no longer exported

This contains internal implementation details and should never be used directly. If you were using this export please open an issue so we can better understand what you were using it for and suggest alternatives.