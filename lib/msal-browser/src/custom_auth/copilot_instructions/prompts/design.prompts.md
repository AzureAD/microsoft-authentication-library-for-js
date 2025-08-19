# Native Authentication Feature Design Document Generation Prompt

You are an expert software architect tasked with creating a comprehensive design document for a Native Authentication feature in the MSAL Browser SDK. You have been provided with a detailed specification and requirements document for the feature.

## Input Context

-   Specification doc: [INSERT SPEC DOC]
-   Requirements doc: [INSERT REQUIREMENTS DOC]
-   Directories or files in the codebase that the AI should examine: [INSERT CODE PATH]

## Instructions

Using the provided specification and requirements documents, create a detailed design document that follows this structure and includes the specified content types:

### Document Structure Required:

1. **Overview**

    - Brief feature description and purpose
    - How it aligns with existing SDK patterns
    - Integration approach with current flows

2. **Architecture**

    - High-level flow diagram (sequence diagram preferred, but other diagram types acceptable if more appropriate for the scenario)
    - Component architecture description
    - Layer relationships and interactions

3. **Components and Interfaces**

    - **Network Client Layer**: API clients following `BaseApiClient` pattern
    - **Interaction Client Layer**: Business logic orchestration clients
    - **State Machine Layer**: State classes with proper inheritance
    - **Result Objects**: Structured result types with type checking methods
    - **Error Handling**: Feature-specific error types with helper methods

4. **Data Models**

    - Interface definitions for feature-specific data types
    - Request/response type definitions
    - Parameter and configuration interfaces

5. **Integration Points**

    - How the feature integrates with existing flows (SignIn, SignUp, etc.)
    - Controller updates and dependency injection
    - Entry point modifications

6. **Testing Strategy**

    - Unit testing approach for each component layer
    - Integration testing scenarios
    - Error scenario testing coverage

7. **Performance Considerations**

    - Caching strategy and memory management
    - Network optimization approaches
    - Resource cleanup and lifecycle management

8. **Security Considerations**

    - Data protection measures
    - Input validation strategies
    - Authentication flow security guarantees

9. **Migration and Compatibility**
    - Breaking changes assessment
    - Backward compatibility maintenance
    - Migration path for existing users

### Technical Standards to Follow:

-   **Architecture Patterns**: Follow the established MSAL layered architecture (Entry Point → Controller → Interaction Client → Network Client)
-   **State Machine**: Implement explicit state machines with immutable state transitions
-   **Error Handling**: Return errors in result objects, never throw exceptions to SDK users
-   **TypeScript**: Use strict typing, discriminated unions for results, interface-based contracts
-   **Naming Conventions**: Follow existing SDK naming patterns for classes, methods, and files
-   **Code Organization**: Structure files according to the established custom_auth directory patterns

### Content Requirements:

-   **Code Examples**: Provide TypeScript interface definitions and class structures
-   **Flow Diagrams**: Use mermaid syntax for sequence diagrams as first choice, but use other diagram types (flowchart, state diagram, etc.) if they better represent the feature architecture
-   **Integration Examples**: Show how the feature fits into existing SDK usage patterns
-   **Error Scenarios**: Detail error types and helper method implementations
-   **API Contracts**: Define request/response interfaces following existing patterns

### Quality Criteria:

-   The design should be implementable by following existing SDK patterns
-   All public APIs should be strongly typed with clear contracts
-   Error handling should be comprehensive and user-friendly
-   The architecture should be extensible for future enhancements
-   Performance and security considerations should be thoroughly addressed
-   Migration impact should be clearly documented with mitigation strategies

Generate a complete design document in [DESIGN DOC PATH] that technical team members can use as a blueprint for implementation, ensuring it maintains consistency with the existing MSAL Browser SDK architecture and coding standards.
