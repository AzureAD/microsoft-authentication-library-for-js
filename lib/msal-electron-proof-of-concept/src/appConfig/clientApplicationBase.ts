// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ApplicationConfiguration } from './applicationConfiguration';

/**
 * ClientApplicationBase abstract class
 *
 * Abstract class that provides a base for Public and Private Application classes.
 */
export abstract class ClientApplicationBase {
    private config: ApplicationConfiguration;

    constructor(applicationConfiguration: ApplicationConfiguration) {
        this.config = applicationConfiguration;
    }
}
