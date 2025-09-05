# Migrating from MSAL React v3 to v4

## Dropped support for old React versions
MSAL React v4 supports React 19 or greater. It no longer supports React 16, 17, or 18.

## Correct logout bug
MSAL React v4 has fixed a bug and now prevents a page from continuing to display authenticated content for a user after logout. 