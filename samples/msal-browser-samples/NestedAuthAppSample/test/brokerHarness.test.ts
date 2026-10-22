/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import { closeBrokerContext } from "./brokerHarness";

describe("broker browser cleanup", () => {
    const profile = "mock-broker-profile";
    let remove: jest.SpyInstance;
    let contextClose: jest.Mock;
    let browserClose: jest.Mock;
    let context: {
        close: jest.Mock;
        browser: () => { close: jest.Mock };
    };

    beforeEach(() => {
        jest.useFakeTimers();
        remove = jest.spyOn(fs, "rmSync").mockImplementation(() => {});
        contextClose = jest.fn().mockResolvedValue(undefined);
        browserClose = jest.fn().mockResolvedValue(undefined);
        context = {
            close: contextClose,
            browser: () => ({ close: browserClose }),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    function close() {
        return closeBrokerContext({
            context,
            userDataDir: profile,
        });
    }

    it("closes normally and removes the profile without closing the browser twice", async () => {
        await close();
        expect(contextClose).toHaveBeenCalledTimes(1);
        expect(browserClose).not.toHaveBeenCalled();
        expect(remove).toHaveBeenCalledWith(profile, {
            recursive: true,
            force: true,
        });
        expect(jest.getTimerCount()).toBe(0);
    });

    it("closes the owned browser when context closure hangs and reports the timeout", async () => {
        contextClose.mockImplementation(() => new Promise(() => {}));
        const result = expect(close()).rejects.toMatchObject({
            errors: [
                expect.objectContaining({
                    message: expect.stringContaining("timed out"),
                }),
            ],
        });
        await jest.advanceTimersByTimeAsync(10000);
        await result;
        expect(browserClose).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it("preserves context errors after fallback closure", async () => {
        const failure = new Error("context close failed");
        contextClose.mockRejectedValue(failure);
        await expect(close()).rejects.toMatchObject({ errors: [failure] });
        expect(browserClose).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalled();
    });

    it("bounds both closure attempts and retains the profile when neither finishes", async () => {
        contextClose.mockImplementation(() => new Promise(() => {}));
        browserClose.mockImplementation(() => new Promise(() => {}));
        const result = expect(close()).rejects.toMatchObject({
            errors: [
                expect.objectContaining({
                    message: expect.stringContaining("timed out"),
                }),
                expect.objectContaining({
                    message: expect.stringContaining("timed out"),
                }),
            ],
        });
        await jest.advanceTimersByTimeAsync(20000);
        await result;
        expect(remove).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it("preserves failures from both context and browser closure", async () => {
        const contextError = new Error("context close failed");
        const browserError = new Error("browser close failed");
        contextClose.mockRejectedValue(contextError);
        browserClose.mockRejectedValue(browserError);
        await expect(close()).rejects.toMatchObject({
            errors: [contextError, browserError],
        });
        expect(remove).not.toHaveBeenCalled();
    });

    it("reports profile removal failures after closing the context", async () => {
        const failure = new Error("profile is locked");
        remove.mockImplementation(() => {
            throw failure;
        });
        await expect(close()).rejects.toMatchObject({ errors: [failure] });
        expect(contextClose).toHaveBeenCalledTimes(1);
        expect(browserClose).not.toHaveBeenCalled();
    });
});
