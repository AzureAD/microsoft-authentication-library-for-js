// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ApplicationConfiguration } from '../ApplicationConfiguration';
import { AuthOptions } from '../AuthOptions';

/**
 * ClientApplicationBase abstract class
 *
 * Abstract class that provides a base for Public and Private Application classes.
 */
export abstract class ClientApplicationBase {
    private configuration: ApplicationConfiguration;

    constructor(authOptions: AuthOptions) {
        this.configuration = new ApplicationConfiguration(authOptions);
    }

    get config(): ApplicationConfiguration {
        return this.configuration;
    }
}
