// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @hidden
 */
export class TokenResponse {
  valid: boolean;
  parameters: Object;
  stateMatch: boolean;
  stateResponse: string;
  requestType: string;

  constructor() {
    this.valid = false;
    this.parameters = {};
    this.stateMatch = false;
    this.stateResponse = "";
    this.requestType = "unknown";
  }
}
