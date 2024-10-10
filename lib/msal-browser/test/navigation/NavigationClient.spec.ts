/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { TEST_URIS } from "../utils/StringConstants.js";

describe("NavigationClient.ts Unit Tests", () => {
    const navigationClient = new NavigationClient();
    const oldWindow: Window & typeof globalThis = window;

    let oldWindowLocation: Location;

    beforeEach(() => {
        jest.useFakeTimers();
        oldWindowLocation = window.location;
        // @ts-ignore
        delete window.location;
    });

    afterEach(() => {
        window = oldWindow;
        jest.restoreAllMocks();
    });

    describe("navigateInternal tests", () => {
        it("navigateInternal() with noHistory false will call location.assign", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                    done();
                },
            };
            const windowAssignSpy = jest.spyOn(window.location, "assign");
            navigationClient.navigateInternal(TEST_URIS.TEST_LOGOUT_URI, {
                timeout: 30000,
                noHistory: false,
                //@ts-ignore
                apiId: 0,
            });
            expect(windowAssignSpy).toHaveBeenCalledTimes(1);
        });

        it("navigateInternal() with noHistory true will call location.replace", (done) => {
            window.location = {
                ...oldWindowLocation,
                replace: function (url: string) {
                    expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                    done();
                },
            };
            const windowReplaceSpy = jest.spyOn(window.location, "replace");
            navigationClient.navigateInternal(TEST_URIS.TEST_LOGOUT_URI, {
                timeout: 30000,
                noHistory: true,
                //@ts-ignore
                apiId: 0,
            });
            expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
        });

        it("navigateInternal() logs if navigation does not take place within 30 seconds", (done) => {
            window.location = {
                ...oldWindowLocation,
                replace: function (url: string) {
                    expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                    done();
                },
            };

            const windowReplaceSpy = jest.spyOn(window.location, "replace");
            navigationClient.navigateInternal(TEST_URIS.TEST_LOGOUT_URI, {
                timeout: 30000,
                noHistory: true,
                //@ts-ignore
                apiId: 0,
            });
            expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("navigateExternal tests", () => {
        it("navigateExternal() with noHistory false will call location.assign", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url: string) {
                    expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                    done();
                },
            };
            const windowAssignSpy = jest.spyOn(window.location, "assign");
            navigationClient.navigateExternal(TEST_URIS.TEST_LOGOUT_URI, {
                timeout: 30000,
                noHistory: false,
                //@ts-ignore
                apiId: 0,
            });
            expect(windowAssignSpy).toHaveBeenCalledTimes(1);
        });

        it("navigateExternal() with noHistory true will call location.replace", (done) => {
            window.location = {
                ...oldWindowLocation,
                replace: function (url: string) {
                    expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                    done();
                },
            };
            const windowReplaceSpy = jest.spyOn(window.location, "replace");
            navigationClient.navigateExternal(TEST_URIS.TEST_LOGOUT_URI, {
                timeout: 30000,
                noHistory: true,
                //@ts-ignore
                apiId: 0,
            });
            expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
        });

        it("navigateExternal() logs if navigation does not take place within 30 seconds", (done) => {
            window.location = {
                ...oldWindowLocation,
                replace: function (url: string) {
                    expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                    done();
                },
            };

            const windowReplaceSpy = jest.spyOn(window.location, "replace");
            navigationClient.navigateExternal(TEST_URIS.TEST_LOGOUT_URI, {
                timeout: 30000,
                noHistory: true,
                //@ts-ignore
                apiId: 0,
            });
            expect(windowReplaceSpy).toHaveBeenCalledTimes(1);
        });
    });
});
