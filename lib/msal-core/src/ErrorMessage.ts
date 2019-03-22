// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// TODO: Shouldn't this class go away post Error API completion?
/**
 * @hidden
 */
export class ErrorMessage {
  static get authorityUriInvalidPath(): string { return "AuthorityUriInvalidPath"; }
  static get authorityUriInsecure(): string { return "AuthorityUriInsecure"; }
  static get invalidAuthorityType(): string { return "InvalidAuthorityType"; }
  static get unsupportedAuthorityValidation(): string { return "UnsupportedAuthorityValidation"; }
  static get b2cAuthorityUriInvalidPath(): string { return "B2cAuthorityUriInvalidPath"; }
}
