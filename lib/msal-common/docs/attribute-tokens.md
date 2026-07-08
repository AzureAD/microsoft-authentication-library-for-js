# Attribute Tokens

MSAL supports optional caller-provided attribute tokens via the request field `attributeTokens?: string[]` on `BaseAuthRequest`.

Attribute tokens are opaque assertions from an external Attribute Authority. When present and non-empty, MSAL serializes them into the `attribute_tokens` request body parameter.

## Supported grant types

Attribute tokens are currently sent on these `/token` grants:

- Authorization code grant
- Refresh token grant

## Serialization behavior

Serialization is deterministic:

- values are sorted lexicographically
- values are joined with a single space (`" "`)
- duplicates are preserved
- values are not trimmed

## Cache partition isolation behavior

Attribute tokens affect cache partitioning for access tokens.

MSAL computes an attribute-token partition and uses a persisted hash (`additionalCacheKeyComponentsHash`) to isolate cache keys so requests with different attribute-token sets do not collide.

This isolation is additive and backward-compatible:

- entries without additional cache key components keep the legacy key format
- entries with additional cache key components append the persisted hash segment
