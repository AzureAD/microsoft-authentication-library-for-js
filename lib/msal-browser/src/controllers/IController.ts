/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IPublicClientApplication } from "../app/IPublicClientApplication.js";

export interface IController extends IPublicClientApplication {};

export type HandleRedirectPromiseOptions = {
    hash?: string;
    navigateToLoginRequestUrl?: boolean;
};
