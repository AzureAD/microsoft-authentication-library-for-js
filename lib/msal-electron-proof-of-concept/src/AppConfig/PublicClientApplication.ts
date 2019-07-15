// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AuthOptions } from './AuthOptions';
import { ClientApplicationBase } from './ClientApplicationBase';

/**
 * PublicClientApplication class
 *
 * This class can be instantiated into objects that the developer
 * can use in order to acquire tokens.
 */
export class PublicClientApplication extends ClientApplicationBase {
    constructor(authOptions: AuthOptions) {
        super(authOptions);
    }
}
