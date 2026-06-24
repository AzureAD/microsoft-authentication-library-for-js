# MSAL Browser Log Decoder

This script decodes hashed logging strings from browser console logs back to their original messages.

## Overview

The MSAL Browser library hashes logging strings to reduce bundle size. When running in a browser, console logs display these hashes instead of full messages. This decoder script transforms those hashed logs back into readable messages and saves them to a new file.

## Log Format

The script expects log files where each MSAL log entry follows this format:
```
[timestamp] : [correlation-id] : @azure/[module]@[version] : [LogLevel] - [hash][ values...]
```

The `[hash]` is a 6-character code. It may be followed by one or more
space-separated runtime values when the log message originally contained
interpolated variables (the library appends these after the hash so they stay
visible in console logs while keeping the bundle small). The decoder injects
those values back into the message's placeholders, so **do not strip the
trailing tokens** — removing them prevents variable injection during decode.

Example:
```
[Tue, 07 Oct 2025 16:50:29 GMT] : [] : @azure/msal-browser@4.13.1 : Verbose - 0hoqeo
[Tue, 07 Oct 2025 16:50:30 GMT] : [abc-123] : @azure/msal-common@15.7.0 : Info - 1atvtd
[Thu, 11 Jun 2026 21:02:51 GMT] : [019eb87e] : @azure/msal-common@16.6.1 : Verbose - 1q3g2x 69f988bf-86f1-41af-91ab-2d7cd746hg47 {tenantid}
```

In the third line, `1q3g2x` is the hash and the two trailing tokens are runtime
values injected into the decoded message's `${...}` placeholders.

The package/SKU token before `@[version]` may also be a SKU name such as
`msal.js.browser` (and msal-common messages can appear under that browser SKU
header); the decoder normalizes these automatically.

Non-MSAL log lines are preserved unchanged in the output.

## Usage

### Basic Usage
```bash
node scripts/decode-logs.cjs <path-to-log-file>
```

### With NPM Script
```bash
npm run decode-logs -- <path-to-log-file>
```

### Verbose Mode
Add `--verbose` or `-V` flag for detailed debugging information:
```bash
node scripts/decode-logs.cjs --verbose <path-to-log-file>
npm run decode-logs -- --verbose /path/to/console.log
```

### Examples
```bash
# Decode logs from a file
node scripts/decode-logs.cjs ./console-logs.txt
# Output: ./console-logs-decoded.txt

# Decode with verbose output
node scripts/decode-logs.cjs --verbose /Users/user/Downloads/browser-console.log
# Output: /Users/user/Downloads/browser-console-decoded.log

# Using npm script
npm run decode-logs -- ./logs/debug.log
# Output: ./logs/debug-decoded.log
```

## Output

The script creates a new file with the decoded logs in the same directory as the input file, adding a `-decoded` suffix before the file extension:

- Input: `/path/to/debug.log` → Output: `/path/to/debug-decoded.log`

## Features

- **Automatic Version Detection**: Extracts module@version from each log entry and fetches appropriate mappings
- **Multi-Module Support**: Handles logs from multiple MSAL packages (msal-browser, msal-common, etc.)
- **Multiple Versions Support**: Can handle multiple versions of the same module in a single file
- **Efficient Mapping Download**: Downloads each unique module@version combination only once
- **Local Fallback**: Automatically falls back to local mapping files when remote fetching fails
- **Non-MSAL Log Preservation**: Leaves non-MSAL log lines unchanged
- **File Output**: Saves decoded logs to a new file with `-decoded` suffix
- **Remote Mapping Fetching**: Automatically downloads mappings from npm registry
- **Caching**: Caches downloaded mappings for 24 hours to improve performance
- **Verbose Mode**: Detailed debugging information with `--verbose` flag

## How It Works

1. **Scans the entire log file** to identify all unique module@version combinations
2. **Downloads mappings once** for each unique module@version combination
3. **Falls back to local mappings** if remote download fails (for local development)
4. **Identifies MSAL log entries** by pattern matching for `@azure/[module]@[version]`
5. **Decodes hashes** back to original messages using the appropriate mappings
6. **Preserves non-MSAL lines** unchanged
7. **Saves decoded output** to a new file with `-decoded` suffix

## Mapping File Locations

The script looks for mapping files in the following locations within each package:
- **@azure/msal-browser**: `dist/log-strings-mapping.json`, `dist/custom-auth-path/log-strings-mapping.json`
- **@azure/msal-common**: `dist-browser/log-strings-mapping.json`

## Cache Location

Downloaded mappings are cached in: `temp/log-mappings/`

Cache files are valid for 24 hours.
