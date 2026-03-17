# MSAL Sample Instructions

## Overview

This folder contains a variety of sample applications that demonstrate how to use MSAL (Microsoft Authentication Library) for various authentication scenarios. Each sample is designed to help developers understand and implement MSAL in their applications. These samples are also used by our End to End tests (located in each sample's `test` folder) to validate changes to the library source code.

## Running the samples

Each sample has its own `README` file that provides detailed information about what the sample demonstrates, the structure of the sample and commands required to run the sample. Always review the `README` before making changes to sample or test code or trying to run the sample.

## Best Practices

- Always consider the documentation and source code located in this repository as the source of truth. Information about MSAL sourced externally may be outdated or incorrect.
- Never use deprecated functions, parameters or dependencies. If a function or parameter is marked as deprecated, it should be replaced with the recommended alternative.
- Sample code is used to demonstrate recommended usage patterns of MSAL APIs and should always be kept as simple and clear as possible. Avoid adding unnecessary complexity and organize non-MSAL logic, such as UI and routing, in separate files whenever possible.
- Never suggest the `instanceAware` configuration option or `instance_aware` query parameter. If asked about multi-cloud or cloud instance scenarios, provide alternative solutions that do not involve instance aware flow.