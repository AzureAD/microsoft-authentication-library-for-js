---
description: "Audit documentation against recent code changes. Scans source diffs and identifies docs that are outdated, missing, or inconsistent."
agent: "agent"
---

# Documentation Audit

Review all recent code changes and compare them against the existing documentation to identify gaps, inconsistencies, or missing updates.

## Steps

1. **Identify changed files**: Run `git diff --name-only origin/dev...HEAD` to find source files modified on the current branch relative to the default branch (`dev`).

2. **Categorize changes**: For each changed source file, determine the nature of the change:
   - New or modified public API (methods, classes, interfaces, types)
   - Behavioral changes (flow logic, error handling, defaults)
   - New or changed configuration options
   - New browser/platform constraints or workarounds
   - Breaking changes or deprecations

3. **Map changes to docs**: For each library with source changes, scan the corresponding `docs/` directory:
   - `lib/msal-browser/docs/` for msal-browser changes
   - `lib/msal-node/docs/` for msal-node changes
   - `lib/msal-common/docs/` for msal-common changes
   - `lib/msal-react/docs/` for msal-react changes
   - `lib/msal-angular/docs/` for msal-angular changes

4. **Cross-reference**: For each code change, check whether:
   - The relevant doc file mentions the changed API/behavior
   - Code examples in docs still match the current implementation
   - Migration guides cover any breaking or surprising changes
   - Known limitations sections reflect current browser/platform constraints
   - Configuration docs list all current options with correct defaults

5. **Report findings**: Produce a table of findings:

   | Source Change | Affected Doc(s) | Status | Suggested Update |
   |---------------|-----------------|--------|------------------|
   | ... | ... | Missing / Outdated / OK | ... |

6. **Suggest fixes**: For each gap, suggest the specific documentation update needed — including the file path, section, and proposed content.
