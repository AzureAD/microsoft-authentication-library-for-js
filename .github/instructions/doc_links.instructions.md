---
applyTo: "**/*.md"
description: "Use when editing, reviewing, or creating markdown files. Validates that internal links (relative paths and GitHub repository URLs) point to files, directories, and anchors that actually exist. Also applies when files or directories are deleted, renamed, or moved — scan markdown files for stale references."
---

# Documentation Link Integrity

When editing markdown files or deleting/renaming/moving files and directories, verify that all internal links remain valid.

When a repository's link validator reports a broken link, correct the reported link or restore its intended target, then rerun validation. Do not suppress the check merely because the target exists locally. Investigate Git or configuration errors separately rather than assuming every validation failure requires a documentation edit.

## When to check

- **Editing a `.md` file**: Validate all links within the file being edited
- **Deleting or renaming a file or directory**: Search all `.md` files in the repo for references to the old path and update or remove them
- **Adding a new sample or directory**: Ensure it is referenced from the relevant README(s)
- **Reviewing a pull request**: Flag any links that point to paths not present in the PR's final file tree

## What to validate

### Relative links

- `[text](./path/to/file.md)` — verify the target file exists at that relative path
- `[text](../other-package/docs/file.md)` — verify cross-package references resolve correctly
- `[text](./path/to/file.md#anchor)` — verify the anchor heading exists in the target file

### Submodule boundaries

- Never use a relative Markdown link from a parent repository into a nested file within a Git submodule. Use the submodule repository's canonical absolute `blob/<base-branch>/...` URL instead.
- For example, a parent-repository link to `../../microsoft-authentication-library-for-js/lib/msal-browser/docs/configuration.md` must use `https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md`.
- `Test-Path` or filesystem existence is insufficient: an initialized local submodule exposes files that are not stored in the parent repository's committed Git tree. Link validation must consider that tree and the ADO/GitHub web-rendering context.
- Discover submodule roots from `.gitmodules` and confirm boundaries using Git metadata, such as `git ls-tree` entries with mode `160000`. A relative link to the gitlink root itself may be supported by the host; it does not permit linking to nested paths.
- Set each submodule's `branch` in `.gitmodules` to its canonical base branch so link validators can recommend an absolute GitHub URL from the configured repository URL and branch without network access.
- Preserve validation of ordinary same-repository relative paths and heading anchors.

### GitHub repository URLs

- Links containing `github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/` or `/blob/dev/` — verify the referenced path exists in the repo
- Links to specific branches (`/tree/main/`, `/tree/dev/`) — confirm the path exists on that branch
- Links to samples (e.g., `samples/msal-browser-samples/SomeSample`) — confirm the sample directory still exists

### External links

- Do not validate external URLs (e.g., Microsoft docs, npm, MDN) during code review — these require network access
- If an external link is obviously outdated (e.g., references a removed Azure portal blade or a deprecated API version), flag it

## Common broken link patterns

| Scenario | What breaks | Fix |
|----------|-------------|-----|
| Sample directory removed | README links to `samples/.../RemovedSample` | Remove or replace the link |
| File renamed | Links using the old filename | Update to new filename |
| Directory restructured | Relative paths shift | Update all affected relative links |
| Anchor heading changed | `#old-heading` no longer matches | Update to `#new-heading` |
| Branch name changed | `/tree/old-branch/` URLs | Update to current branch |

## How to scan

1. Identify the paths being changed (added, removed, renamed)
2. Search all `.md` files for references to those paths: look for both relative paths and full GitHub URLs
3. For each stale reference, suggest the corrected link or flag for removal
4. When removing a link to a deleted resource, check if there is a replacement (e.g., a successor sample) and link to that instead
