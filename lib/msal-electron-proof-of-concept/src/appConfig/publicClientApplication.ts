import { ClientApplicationBase } from './clientApplicationBase';
import { ApplicationConfiguration } from './applicationConfiguration';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * PublicClientApplication class
 * 
 * This class can be instantiated into objects that the developer
 * can use in order to acquire tokens.
 */
export class PublicClientApplication extends ClientApplicationBase {
    constructor(applicationConfiguration: ApplicationConfiguration) {
        super(applicationConfiguration);
    }
}