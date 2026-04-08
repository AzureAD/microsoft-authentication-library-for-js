---
applyTo: "**/*.md"
description: "Use when editing, reviewing, or creating markdown files. Validates that internal links (relative paths and GitHub repository URLs) point to files, directories, and anchors that actually exist. Also applies when files or directories are deleted, renamed, or moved — scan markdown files for stale references."
---

# Documentation Link Integrity

When editing markdown files or deleting/renaming/moving files and directories, verify that all internal links remain valid.

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
