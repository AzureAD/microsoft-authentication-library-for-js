# MSAL Browser Log Decoder

This script helps decode hashed logging strings from the minified MSAL browser bundle back to their original, human-readable messages.

## Background

When MSAL Browser is built in production mode, all logging strings are minified using consistent hashing to reduce bundle size. This means that instead of seeing:

```
acquireTokenSilent - attempting to acquire token from native platform
```

Users will see:

```
ac8ab7
```

This script allows you to decode these hashes back to the original messages for debugging purposes.

## Features

- **Remote Mapping Fetching**: Automatically fetches log mappings from npm registry for specific versions
- **Multi-Package Support**: Combines mappings from both `@azure/msal-browser` and `@azure/msal-common` packages
- **Multiple Input Formats**: Supports various hash input formats (arrays, space-separated, JSON)
- **Timing Information**: Supports new format with timing data for performance analysis
- **Verbose Mode**: Optional detailed output for debugging
- **Caching**: Caches remote mappings locally (24 hours) to reduce network requests
- **Fallback Support**: Falls back to local mappings when remote fetching fails

## Usage

### Basic Usage

```bash
# Decode hashes using local mappings
npm run decode-logs -- [ac8ab7,b2c9d1,e4f6a3]

# Decode with timing information (new format)
npm run decode-logs -- [0,ac8ab7;5,b2c9d1;10,e4f6a3]

# Space separated hashes
npm run decode-logs -- ac8ab7 b2c9d1 e4f6a3

# Single hash
npm run decode-logs -- ac8ab7

# Using stdin
echo '[ac8ab7,e4f6a3]' | npm run decode-logs
```

### Remote Version Support

```bash
# Fetch mappings for specific version
npm run decode-logs -- --version 4.13.1 [ac8ab7,b2c9d1,e4f6a3]

# Use latest published version
npm run decode-logs -- --version latest [ac8ab7,b2c9d1,e4f6a3]

# With timing information
npm run decode-logs -- --version 4.13.1 [0,ac8ab7;5,b2c9d1;10,e4f6a3]
```

### Verbose Mode

```bash
# Enable verbose output for debugging
npm run decode-logs -- --verbose [ac8ab7,b2c9d1,e4f6a3]

# Combine with version fetching
npm run decode-logs -- --verbose --version 4.13.1 [ac8ab7,b2c9d1,e4f6a3]
```

### Direct Script Execution

```bash
# Basic usage
node scripts/decode-logs.cjs [ac8ab7,b2c9d1,e4f6a3]

# With version and verbose mode
node scripts/decode-logs.cjs --version 4.13.1 --verbose [0,ac8ab7;5,b2c9d1;10,e4f6a3]

# Using stdin
echo '[ac8ab7,e4f6a3]' | node scripts/decode-logs.cjs
```

## Input Formats

The script accepts multiple input formats for maximum flexibility:

### 1. Simple Array (recommended)
```bash
[hash1,hash2,hash3]           # No quotes needed!
```

### 2. Timing Format (new)
```bash
[0,ac8ab7;5,b2c9d1;10,e4f6a3]    # [milliseconds,hash;...]
0,ac8ab7;5,b2c9d1;10,e4f6a3      # Without brackets also works
```

### 3. Space Separated
```bash
ac8ab7 b2c9d1 e4f6a3             # For multiple hashes
```

### 4. JSON Array (legacy)
```bash
'["ac8ab7", "b2c9d1", "e4f6a3"]' # Traditional format (still supported)
```

### 5. Single Hash
```bash
ac8ab7                         # For a single hash
```

### 6. Stdin
Pipe any of the above formats via stdin.

## Output Formats

### Standard Output
```
MSAL Browser Log Decoder

[1] acquireTokenSilent - attempting to acquire token from native platform
[2] acquireTokenByCode called  
[3] TokenCache - loading account

Summary:
✓ Decoded: 3
```

### With Timing Information
```
MSAL Browser Log Decoder

[1] +0ms acquireTokenSilent - attempting to acquire token from native platform
[2] +5ms acquireTokenByCode called  
[3] +10ms TokenCache - loading account

Summary:
✓ Decoded: 3
```

### With Unknown Hashes
```
MSAL Browser Log Decoder

[1] +0ms acquireTokenSilent - attempting to acquire token from native platform
[2] +5ms Unknown hash: xyz123
[3] +10ms acquireTokenByCode called

Summary:
✓ Decoded: 2
✗ Not found: 1
Unknown hashes: xyz123
Note: Unknown hashes might be from a different build or version.
```

### Verbose Mode Output
When using `--verbose`, additional information is displayed:
- Remote fetching progress
- Package metadata details
- Mapping file sources and statistics
- Network requests and caching information

## Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--version <version>` | `-v` | Fetch mappings for specific version (e.g., `4.13.1`, `latest`) |
| `--verbose` | `-V` | Enable verbose logging for debugging |
| `--help` | `-h` | Show help information |

## Remote Mapping Support

The script can automatically fetch log mappings from the npm registry:

- **@azure/msal-browser**: Fetched from public npm registry
- **@azure/msal-common**: Fetched from public npm registry (dependency)
- **Caching**: Remote mappings are cached locally for 24 hours
- **Fallback**: Falls back to local mappings if remote fetching fails

### Cache Location
Remote mappings are cached in: `temp/log-mappings/`

## Requirements

- Node.js environment
- Internet connection (for remote mapping fetching)
- Local `lib/log-strings-mapping.json` file (generated during build) for fallback

## Examples

### Customer logs with timing
If a customer sends you logs like:
```
[0,ac8ab7;150,b2c9d1;300,e4f6a3;450,x7y9z2]
```

Decode with specific version:
```bash
npm run decode-logs -- --version 4.13.1 [0,ac8ab7;150,b2c9d1;300,e4f6a3;450,x7y9z2]
```

### Real-world debugging scenario
Customer reports: "I'm getting error hash `e6a1b8` during token acquisition in version 4.12.0"

```bash
npm run decode-logs -- --version 4.12.0 e6a1b8
```

Output:
```
MSAL Browser Log Decoder

[1] TokenCache - scopes not specified in the request or response. Cannot add token to the cache.

Summary:
✓ Decoded: 1
```

### Debug with verbose information
```bash
npm run decode-logs -- --verbose --version latest [0,ac8ab7;5,b2c9d1]
```

Shows detailed information about:
- Which packages are being fetched
- Mapping file sources and timestamps
- Network requests and caching
- Combined mapping statistics

## Troubleshooting

### Script not found
Make sure you're running from the msal-browser directory.

### Mapping file not found (local)
Run `npm run build` to generate the `lib/log-strings-mapping.json` file.

### Unknown hashes
- Hashes might be from a different version - try using `--version <specific-version>`
- Try using `--version latest` to get the most recent mappings
- Use `--verbose` to see detailed fetching information

### Remote fetching fails
- Check internet connection
- The script will automatically fall back to local mappings
- Use `--verbose` to see detailed error information

### Cache issues
Delete the cache directory to force fresh downloads:
```bash
rm -rf temp/log-mappings/
```

## Advanced Usage

### Combining local and remote mappings
The script automatically combines mappings from multiple sources:
1. @azure/msal-browser (main library)
2. @azure/msal-common (shared library)

### Performance analysis with timing
Use the timing format to analyze performance:
```bash
npm run decode-logs -- --version 4.13.1 [0,a1b2c3;150,d4e5f6;300,g7h8i9]
```

This shows the progression of operations with their timing offsets.
