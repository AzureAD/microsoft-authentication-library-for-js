// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @hidden
 */
export class Telemetry {
  private static instance: Telemetry;
  private receiverCallback: (r: Array<Object>) => void;

  constructor() {
      return;
  }

  RegisterReceiver(receiverCallback: (receiver: Array<Object>) => void): void {
    this.receiverCallback = receiverCallback;
  }

  static GetInstance(): Telemetry {
    return this.instance || (this.instance = new this());
  }
}
