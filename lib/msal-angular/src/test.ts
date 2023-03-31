/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "zone.js/dist/zone";
import "zone.js/dist/zone-testing";
// eslint-disable-next-line import/no-unresolved
import { getTestBed } from "@angular/core/testing";
// eslint-disable-next-line import/no-unresolved
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from "@angular/platform-browser-dynamic/testing";

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
);
