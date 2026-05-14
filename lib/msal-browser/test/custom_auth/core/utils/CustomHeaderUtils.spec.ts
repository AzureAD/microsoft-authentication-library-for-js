/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { filterCustomHeaders } from "../../../../src/custom_auth/core/utils/CustomHeaderUtils.js";
import { Logger } from "@azure/msal-common/browser";

describe("CustomHeaderUtils.filterCustomHeaders", () => {
    it("returns an empty record when headers are undefined", () => {
        expect(filterCustomHeaders(undefined)).toEqual({});
    });

    it("returns an empty record when headers are null", () => {
        expect(filterCustomHeaders(null)).toEqual({});
    });

    it("returns an empty record when headers are an empty object", () => {
        expect(filterCustomHeaders({})).toEqual({});
    });

    it("keeps headers that start with x- (lowercase)", () => {
        const result = filterCustomHeaders({
            "x-vendor-token": "abc",
            "x-correlation-id": "123",
        });

        expect(result).toEqual({
            "x-vendor-token": "abc",
            "x-correlation-id": "123",
        });
    });

    it("keeps headers that start with X- (uppercase) preserving original casing", () => {
        const result = filterCustomHeaders({
            "X-Vendor-Token": "abc",
            "X-My-Header": "value",
        });

        expect(result).toEqual({
            "X-Vendor-Token": "abc",
            "X-My-Header": "value",
        });
    });

    it("keeps headers with mixed casing that start with x-", () => {
        const result = filterCustomHeaders({
            "X-vendor-Token": "abc",
            "x-Custom-HEADER": "value",
        });

        expect(result).toEqual({
            "X-vendor-Token": "abc",
            "x-Custom-HEADER": "value",
        });
    });

    it("drops headers that do not start with x-", () => {
        const result = filterCustomHeaders({
            authorization: "Bearer abc",
            "content-type": "application/json",
            value_1: "customer_header_1",
        });

        expect(result).toEqual({});
    });

    it("drops headers that start with the reserved prefix x-client-", () => {
        const result = filterCustomHeaders({
            "x-client-header": "should-be-dropped",
            "x-client-VER": "should-be-dropped",
            "x-vendor": "kept",
        });

        expect(result).toEqual({ "x-vendor": "kept" });
    });

    it("drops headers that start with the reserved prefix x-ms-", () => {
        const result = filterCustomHeaders({
            "x-ms-request-id": "should-be-dropped",
            "X-MS-Custom": "should-be-dropped",
            "x-vendor": "kept",
        });

        expect(result).toEqual({ "x-vendor": "kept" });
    });

    it("drops headers that start with the reserved prefix x-broker-", () => {
        const result = filterCustomHeaders({
            "x-broker-id": "should-be-dropped",
            "X-Broker-Version": "should-be-dropped",
            "x-vendor": "kept",
        });

        expect(result).toEqual({ "x-vendor": "kept" });
    });

    it("drops headers that start with the reserved prefix x-app-", () => {
        const result = filterCustomHeaders({
            "x-app-version": "should-be-dropped",
            "X-App-Name": "should-be-dropped",
            "x-vendor": "kept",
        });

        expect(result).toEqual({ "x-vendor": "kept" });
    });

    it("matches reserved prefixes case-insensitively", () => {
        const result = filterCustomHeaders({
            "X-CLIENT-SOMETHING": "drop",
            "x-Ms-thing": "drop",
            "X-Broker-X": "drop",
            "X-App-Z": "drop",
            "X-vendor": "keep",
        });

        expect(result).toEqual({ "X-vendor": "keep" });
    });

    it("keeps headers whose names contain reserved prefix substrings but do not start with them", () => {
        const result = filterCustomHeaders({
            "x-foo-client-bar": "kept",
            "x-not-ms-thing": "kept",
        });

        expect(result).toEqual({
            "x-foo-client-bar": "kept",
            "x-not-ms-thing": "kept",
        });
    });

    it("filters a mixed set as described in the documentation example", () => {
        const result = filterCustomHeaders({
            value_1: "customer_header_1",
            "x-client-header": "customer_header_2",
            "X-my-custom-header": "my data",
        });

        expect(result).toEqual({
            "X-my-custom-header": "my data",
        });
    });

    it("drops headers with empty or whitespace-only names", () => {
        const result = filterCustomHeaders({
            "": "empty-name",
            "   ": "whitespace-name",
            "x-keep": "value",
        });

        expect(result).toEqual({ "x-keep": "value" });
    });

    it("trims whitespace around header names before applying rules", () => {
        const result = filterCustomHeaders({
            "  x-vendor  ": "trimmed",
        });

        expect(result).toEqual({ "x-vendor": "trimmed" });
    });

    it("keeps differently-cased variants of the same name as distinct entries (case-sensitive keys, case-insensitive prefix match)", () => {
        const result = filterCustomHeaders({
            "x-Custom-header": "first",
            "x-custom-Header": "second",
            "X-CUSTOM-HEADER": "third",
        });

        expect(result).toEqual({
            "x-Custom-header": "first",
            "x-custom-Header": "second",
            "X-CUSTOM-HEADER": "third",
        });
    });

    it("treats reserved-prefix checks case-insensitively across casings of the same logical name", () => {
        const result = filterCustomHeaders({
            "x-Client-Header": "drop",
            "X-CLIENT-header": "drop",
            "x-client-Header": "drop",
        });

        expect(result).toEqual({});
    });

    it("logs a PII-safe warning for headers that do not start with x-", () => {
        const logger = new Logger({}, "test", "1.0.0");
        const warningSpy = jest
            .spyOn(logger, "warningPii")
            .mockImplementation(() => {});

        const result = filterCustomHeaders(
            {
                authorization: "Bearer abc",
                value_1: "customer_header_1",
            },
            logger,
            "corr-1"
        );

        expect(result).toEqual({});
        expect(warningSpy).toHaveBeenCalledTimes(2);
        expect(warningSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'Additional header field "authorization" must start with the "x-" prefix. Ignoring.'
            ),
            "corr-1"
        );
        expect(warningSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'Additional header field "value_1" must start with the "x-" prefix. Ignoring.'
            ),
            "corr-1"
        );
    });

    it("logs a PII-safe warning naming the matched reserved prefix", () => {
        const logger = new Logger({}, "test", "1.0.0");
        const warningSpy = jest
            .spyOn(logger, "warningPii")
            .mockImplementation(() => {});

        const result = filterCustomHeaders(
            {
                "x-client-header": "drop",
                "X-MS-Custom": "drop",
                "x-broker-id": "drop",
                "x-app-version": "drop",
            },
            logger,
            "corr-2"
        );

        expect(result).toEqual({});
        expect(warningSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'Additional header field "x-client-header" uses reserved prefix "x-client-". Ignoring.'
            ),
            "corr-2"
        );
        expect(warningSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'Additional header field "X-MS-Custom" uses reserved prefix "x-ms-". Ignoring.'
            ),
            "corr-2"
        );
        expect(warningSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'Additional header field "x-broker-id" uses reserved prefix "x-broker-". Ignoring.'
            ),
            "corr-2"
        );
        expect(warningSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'Additional header field "x-app-version" uses reserved prefix "x-app-". Ignoring.'
            ),
            "corr-2"
        );
    });

    it("does not emit warnings for kept headers", () => {
        const logger = new Logger({}, "test", "1.0.0");
        const warningSpy = jest
            .spyOn(logger, "warningPii")
            .mockImplementation(() => {});

        const result = filterCustomHeaders(
            { "X-my-custom-header": "keep" },
            logger,
            "corr-3"
        );

        expect(result).toEqual({ "X-my-custom-header": "keep" });
        expect(warningSpy).not.toHaveBeenCalled();
    });
});
