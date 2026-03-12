---
applyTo: "**/change/**"
---

# Changefiles

Change type should always be either `patch` or `minor` for any changes to files in the `src` directory or changes that may impact the build output. Pull requests that only make changes to `docs` and/or `test` should always have a change type of `none`.

Change message should always include a description of the change followed by the PR number (as a link to the PR).

Template: Brief description of change [#XXXX](PR_URL)
Example: Fix documentation [#7880](https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/7880)

## When reviewing pull requests

Use GitHub's code suggestion feature (i.e., suggestion code blocks) instead of plain text descriptions whenever possible.
