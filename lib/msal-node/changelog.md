# 1.0.0-alpha.2
- Fix an issue where the `dist` folder was not published (#2013)

# 1.0.0-alpha.1

- Add `response` to device code in `msal-node` (#1947)
- `msal-node` docs update (#1948)
- Export `AccountInfo` in `msal-node (#2005)

# 1.0.0-alpha.0

- scaffolding (#1328)
- Configuration and Client (#1325)
- Account and Authority (#1330)
- initial compatibility with other libs (#1342)
- `msal-node` crypto module (#1368)
- `msal-node` network module (#1371)
- `msal-node` lerna support (#1383)
- `msal-common` and `msal-node` Client applications, authorization code and device code flow (#1409)
- `msal-node` add DEBUG logging (#1423)
- `msal-common` authority changes (#1424)
- `msal-node` and `msal-common` unit tests for changes in #1409 (#1449)
- `msal-node` switch `strictNullChecks:true` for msal-node (#1478)
- `msal-node` and `msal-common` Update generation of client info headers (#1482)
- `msal-node` and `msal-common` Support for acquiring a token with refresh token (#1496)
- `msal-node` and `msal-common` Move authority generation from common to node (#1537)
- `msal-node` fix casing issue (#1630)
- `msal-node` Cache implementation (#1444, #1471, #1519, #1520, #1522, #1622, #1655, #1680)
- `msal-node` Silent Flow support (#1711)
- merge cache logic for all platforms (#1762)
- Utilize ScopeSet across the library (#1770)
- Update UnifiedCacheManager.ts (#1771)
- Node cache interface (#1801)
- SilentFlow node interface (#1809)
- Update TokenCache name (#1901)
