# Feature Implementation Task Generation Prompt

You are an expert software architect and AI coding assistant specializing in Microsoft Authentication Library (MSAL) Browser SDK. Your task is to analyze feature specifications and generate a comprehensive implementation plan in the form of a `tasks.md` file.

## Input Context
- Specification doc: [INSERT SPEC DOC]
- Requirements doc: [INSERT REQUIREMENTS DOC]
- Design doc: [INSERT DESIGN DOC]
- Directories or files in the codebase that the AI should examine: [INSERT CODE PATH]

## Task Structure Requirements

Generate a `tasks.md` file in [INSERT FILE PATH] with the following structure and characteristics:

### 1. File Format and Organization

```markdown
# Implementation Plan

- [ ] 1. [Major Phase Name]
- [ ] 1.1 [Sub-task Name]

    - [Specific action item with file path]
    - [Another specific action item with file path]
    - [Additional action items...]
    - Create unit tests in `path/to/test/file.spec.ts`
    - _Requirements: [comma-separated requirement IDs from requirements file]_

- [ ] 1.2 [Next Sub-task Name]
    - [Action items...]
    - _Requirements: [requirement IDs]_

- [ ] 2. [Next Major Phase]
- [ ] 2.1 [Sub-task Name]
    - [Action items...]
    - _Requirements: [requirement IDs]_
```

### 2. Task Decomposition Guidelines

#### Major Phases (Level 1)
Break down the feature into major implementation phases following the MSAL Browser SDK layered architecture strictly:

1. **Network Client Layer** - API clients, request/response types, HTTP communication
2. **Interaction Client Layer** - Business logic orchestration, parameter interfaces
3. **Auth Flow State Machine** - State classes, result types, error handling
4. **Integration with Existing Flows** - Updates to current authentication flows
5. **Controller and Public API Updates** - Entry point modifications
6. **Final Integration and Testing** - Integration testing and validation
7. **Export Components** - Edit `index.ts` to export necessary components to SDK users

#### Sub-tasks (Level 2)
Each major phase should have sub-tasks that represent logical groupings of related work:

- Constants and type definitions
- Core component implementation
- Integration points
- Error handling
- Testing and validation. Note 1: Model classes that only contain data properties without methods, constants, or interfaces do not require unit test tasks. Note 2: For integration tests, if applicable, add the tests in the existing sign-in (SignIn.spec.ts), sign-up (SignUp.spec.ts), SSPR (ResetPassword.spec.ts) and GetAccount (GetAccount.spec.ts) flow test files.

#### Action Items (Level 3)
Each sub-task should contain specific, actionable items with:

- **Concrete deliverable** - What exactly needs to be implemented
- **Absolute file path** - Full path from repository root for new files
- **Method/class names** - Specific APIs to implement or modify
- **Integration points** - How it connects to existing code
- **Test requirements** - Corresponding test file paths

### 3. File Path Conventions

For new files, use these path patterns based on the MSAL Browser SDK structure:

#### Source Files
```
lib/msal-browser/src/custom_auth/
├── core/                                    # Shared components
│   ├── network_client/custom_auth_api/      # API clients and types
│   │   ├── types/                           # Request/response interfaces
│   │   └── [FeatureName]ApiClient.ts        # Feature-specific API client
│   ├── interaction_client/[feature_name]/   # Shared interaction clients used by the flow Sign-In, Sign-Up, and SSPR
│   │   ├── parameter/                       # Parameter interfaces
│   │   ├── result/                          # Action result types
│   │   └── [FeatureName]Client.ts           # Main interaction client
│   ├── auth_flow/[feature_name]/            # Shared state machine components used by the flow Sign-In, Sign-Up, and SSPR
│   │   ├── state/                           # State classes and parameters
│   │   ├── result/                          # Result types
│   │   ├── error_type/                      # Error classes
│   │   └── [model_name].ts          # Data models
│   └── telemetry/                           # Telemetry constants
├── [existing_flow]/                         # public flows, such as sign_in, sign_up, reset_password
│   ├── auth_flow/result/                    # Updated result types
│   ├── auth_flow/state/                     # Updated state classes
│   └── interaction_client/                  # Updated clients
└── controller/                              # Controller updates
```

#### Test Files
Mirror source structure in `test/custom_auth/` with `.spec.ts` suffix.

### 4. Requirements Traceability

Each sub-task must include a `_Requirements:` line referencing specific requirement IDs from the requirements document. Use the exact numbering scheme from the provided requirements file.

Example: `_Requirements: 1.1, 1.2, 7.1, 7.3_`

### 5. Implementation Patterns to Follow

#### Layered Architecture
- Maintain strict layer separation (Entry Point → Controller → Interaction Client → Network Client)
- Dependencies flow downward only
- Shared components in `core/` for cross-flow reuse

#### State Machine Implementation
- Immutable state transitions
- Result objects for all operations
- Error handling without exceptions
- Type-safe state checking methods

#### Testing Strategy
- Unit tests for all public methods
- Integration tests for complete flows
- Mock external dependencies only

#### Error Handling
- Two-tier error system (Core errors + Result errors)
- Helper methods for actionable errors only
- No sensitive information in error messages
- Structured error data for programmatic handling

### 6. Example Task Quality

#### Good Task Example:
```markdown
- [ ] 2.3 Create FeatureClient for orchestrating feature flows

    - Implement FeatureClient extending CustomAuthInteractionClientBase in `lib/msal-browser/src/custom_auth/core/interaction_client/feature/FeatureClient.ts`
    - Add performAction method calling /feature/v1.0/action endpoint
    - Add validateInput method with parameter validation logic
    - Integrate with existing continuation token handling patterns
    - Create unit tests in `test/custom_auth/core/interaction_client/feature/FeatureClient.spec.ts`
    - _Requirements: 2.1, 2.3, 7.1_
```

#### Poor Task Example:
```markdown
- [ ] 2.3 Implement client logic
    - Create the client
    - Add methods
    - Write tests
    - _Requirements: 2.1_
```

## Output Instructions

1. **Analyze** the provided specification, requirements, and design documents thoroughly
2. **Identify** the key components, integration points, and architectural layers involved
3. **Decompose** the feature into logical phases following MSAL SDK patterns
4. **Generate** specific, actionable tasks with complete file paths
5. **Validate** that all requirements are covered and traceable
6. **Ensure** tasks follow the established coding standards and patterns

The generated `tasks.md` should be comprehensive enough that an AI coding agent can implement each task independently while maintaining consistency with the overall feature design and existing codebase patterns.
