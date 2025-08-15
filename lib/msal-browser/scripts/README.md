# MSAL Browser Log Decoder

This script helps decode hashed logging strings from the minified MSAL browser bundle back to their original, human-readable messages.

## Background

When MSAL Browser is built in production mode, all logging strings are minified using consistent hashing to reduce bundle size. This means that instead of seeing:

```
acquireTokenSilent - attempting to acquire token from native platform
```

Users will see:

```
11757953
```

This script allows you to decode these hashes back to the original messages for debugging purposes.

## Usage

### Via npm script (recommended)

```bash
# Decode multiple hashes - simple array format (no quotes needed!)
npm run decode-logs -- [11757953,22757575,bfd4c713]

# Decode multiple hashes - space separated
npm run decode-logs -- 11757953 22757575 bfd4c713

# Decode multiple hashes - traditional JSON format (still supported)
npm run decode-logs -- '["11757953", "22757575", "bfd4c713"]'

# Decode a single hash
npm run decode-logs -- 11757953

# Using stdin
echo '[11757953,bfd4c713]' | npm run decode-logs
```

### Direct script execution

```bash
# Decode multiple hashes - simple array format
node scripts/decode-logs.cjs [11757953,22757575,bfd4c713]

# Decode multiple hashes - space separated  
node scripts/decode-logs.cjs 11757953 22757575 bfd4c713

# Decode multiple hashes - traditional JSON format
node scripts/decode-logs.cjs '["11757953", "22757575", "bfd4c713"]'

# Decode a single hash  
node scripts/decode-logs.cjs 11757953

# Using stdin
echo '[11757953,bfd4c713]' | node scripts/decode-logs.cjs
```

## Input Format

The script accepts multiple input formats for maximum flexibility:

1. **Simple Array** (recommended): `[hash1,hash2,hash3]` - no quotes needed!
2. **Space Separated**: `hash1 hash2 hash3` - for multiple hashes
3. **JSON Array**: `["hash1", "hash2", "hash3"]` - traditional format (still supported)
4. **Single Hash**: `hash1` - for a single hash
5. **Stdin**: Pipe any of the above formats via stdin

## Output Format

The script outputs each decoded message on a new line with a numbered prefix:

```
MSAL Browser Log Decoder
Decoding 3 log entries...

[1] acquireTokenSilent - attempting to acquire token from native platform
[2] acquireTokenByCode called  
[3] TokenCache - loading account

Summary:
✓ Decoded: 3
```

If unknown hashes are encountered:

```
[1] acquireTokenSilent - attempting to acquire token from native platform
[2] Unknown hash: unknown123
[3] acquireTokenByCode called

Summary:
✓ Decoded: 2
✗ Not found: 1
Unknown hashes: unknown123
Note: Unknown hashes might be from a different build or version.
```

## Requirements

- The `lib/log-strings-mapping.json` file must exist (generated during build)
- Node.js environment

## Examples

### Customer logs example

If a customer sends you logs like:
```
[11757953,22757575,bfd4c713,ac8ab727]
```

You can decode them with (no quotes needed!):
```bash
npm run decode-logs -- [11757953,22757575,bfd4c713,ac8ab727]
```

Or if they send space-separated hashes:
```bash
npm run decode-logs -- 11757953 22757575 bfd4c713 ac8ab727
```

### Real-world debugging scenario

Customer reports: "I'm getting error hash `e6a1b82a` during token acquisition"

```bash
npm run decode-logs -- "e6a1b82a"
```

Output:
```
[1] TokenCache - scopes not specified in the request or response. Cannot add token to the cache.
```

## Troubleshooting

### Script not found
Make sure you're running from the msal-browser directory and the build has been completed.

### Mapping file not found  
Run `npm run build` to generate the `lib/log-strings-mapping.json` file.

### Unknown hashes
Hashes might be from a different version or build. Ensure you're using the mapping file from the same build as the logs.
