---
description: "Audit documentation against recent code changes. Scans source diffs and identifies docs that are outdated, missing, or inconsistent. Also validates that all internal links in markdown files point to valid targets."
agent: "agent"
---

# Documentation Audit

Review all recent code changes and compare them against the existing documentation to identify gaps, inconsistencies, broken links, or missing updates.

## Steps

1. **Identify changed files**: Run `git diff --name-only upstream/dev...HEAD` to find source files modified on the current branch relative to the default branch (`dev`).

2. **Categorize changes**: For each changed source file, determine the nature of the change:
   - New or modified public API (methods, classes, interfaces, types)
   - Behavioral changes (flow logic, error handling, defaults)
   - New or changed configuration options
   - New browser/platform constraints or workarounds
   - Breaking changes or deprecations
   - Deleted or renamed files, directories, or samples

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

5. **Validate links**: Scan all `.md` files in affected libraries for broken links:
   - **Deleted/renamed files**: Search all `.md` files for relative paths and GitHub URLs referencing removed or renamed paths
   - **Relative links**: Verify `[text](./path)` targets exist at the resolved path
   - **GitHub URLs**: Verify links containing `github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/` or `/blob/dev/` reference paths that exist in the repo
   - **Anchor links**: Verify `#heading-anchor` references match actual headings in the target file
   - **Sample links**: Confirm links to `samples/` directories point to samples that still exist

6. **Report findings**: Produce a table of findings:

   | Source Change | Affected Doc(s) | Status | Suggested Update |
   |---------------|-----------------|--------|------------------|
   | ... | ... | Missing / Outdated / OK | ... |

   And a separate table for link issues:

   | File | Broken Link | Reason | Suggested Fix |
   |------|-------------|--------|---------------|
   | ... | ... | Target deleted / Renamed / Anchor missing | ... |

7. **Suggest fixes**: For each gap, suggest the specific documentation update needed — including the file path, section, and proposed content.
