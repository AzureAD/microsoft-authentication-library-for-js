# GitHub Configuration

This directory contains GitHub-specific configuration files for the microsoft-authentication-library-for-js repository.

## GitHub Copilot Configuration

This repository is configured to work optimally with GitHub Copilot coding agents. The configuration follows [GitHub's best practices for Copilot coding agents](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions).

### Repository-Wide Instructions

**File:** `copilot-instructions.md`

This file provides Copilot with comprehensive context about the entire repository, including:
- Repository overview and architecture
- Build and validation instructions
- Project layout and structure
- Code standards and best practices
- Telemetry and performance monitoring guidelines
- PR review guidelines

All Copilot coding agents will automatically use these instructions when working on any files in this repository.

### Path-Specific Instructions

**Directory:** `instructions/`

This directory contains specialized instruction files that apply to specific areas of the codebase. Each file uses YAML frontmatter to define which files/paths it applies to.

Current instruction files:
- `custom_auth_product.instructions.md` - Product requirements for Native Authentication features
- `custom_auth_structure.instructions.md` - Code organization and structure guidelines for custom_auth
- `custom_auth_tech.instructions.md` - Technical standards and implementation patterns for custom_auth

These instructions are automatically applied when Copilot works on files matching the `applyTo` patterns defined in each file's frontmatter.

### How Instructions Work

When a GitHub Copilot coding agent works on this repository:

1. It loads the repository-wide instructions from `copilot-instructions.md`
2. It checks the `instructions/` folder for any files with `applyTo` patterns matching the files being modified
3. It combines all applicable instructions to provide context-aware assistance

### Maintaining Instructions

#### When to Update Repository-Wide Instructions

Update `copilot-instructions.md` when:
- Build or test procedures change
- New major packages or components are added
- Repository structure changes significantly
- Code standards or best practices are updated
- PR review process or requirements change

#### When to Add Path-Specific Instructions

Create new `.instructions.md` files in the `instructions/` folder when:
- A new major feature or component is added with unique requirements
- A specific area has specialized coding patterns or standards
- Certain paths need different testing, documentation, or review processes

#### Instruction File Format

Path-specific instruction files must:
1. Have the `.instructions.md` extension
2. Include YAML frontmatter with an `applyTo` field defining glob patterns
3. Provide clear, actionable guidance specific to the matched files

Example:
```markdown
---
applyTo: "**/feature_name/**"
---

# Feature Name Guidelines

[Your instructions here]
```

### Custom Agents

The `.github/agents/` directory can be used to define custom agent personas with specialized expertise for specific tasks. This is currently not configured but can be added if needed for highly specialized workflows.

## Other GitHub Configurations

This directory also contains:
- **workflows/** - GitHub Actions workflow definitions for CI/CD
- **ISSUE_TEMPLATE/** - Issue templates for bug reports and feature requests
- **policies/** - Repository policies and automation rules
- **actions/** - Custom GitHub Actions used in workflows

For more information about contributing to this repository, see [CONTRIBUTING.md](../contributing.md) in the root directory.
