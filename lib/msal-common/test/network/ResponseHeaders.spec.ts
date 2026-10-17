/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    getResponseHeader,
    normalizeResponseHeaders,
} from "../../src/network/ResponseHeaders.js";
import { HeaderNames } from "../../src/utils/Constants.js";
import * as defaultApi from "../../src/index.js";
import * as browserApi from "../../src/index-browser.js";
import * as nodeApi from "../../src/index-node.js";

describe("ResponseHeaders", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([
        { name: "default", api: defaultApi },
        { name: "browser", api: browserApi },
        { name: "node", api: nodeApi },
    ])("does not expose helpers through the $name entrypoint", ({ api }) => {
        expect(api).not.toHaveProperty("normalizeResponseHeaders");
        expect(api).not.toHaveProperty("getResponseHeader");
    });

    it("normalizes a frozen dictionary without mutating the input", () => {
        const headers = Object.freeze({
            "Retry-After": "120",
            "WWW-Authenticate": 'PoP nonce="CaseSensitiveNonce"',
        });

        const normalized = normalizeResponseHeaders(headers);

        expect(normalized).toEqual({
            "retry-after": "120",
            "www-authenticate": 'PoP nonce="CaseSensitiveNonce"',
        });
        expect(headers["Retry-After"]).toBe("120");
        expect(normalized).not.toBe(headers);
    });

    it("does not cache caller-owned dictionaries between responses", () => {
        const headers = { "Retry-After": "120" };
        const first = normalizeResponseHeaders(headers);
        headers["Retry-After"] = "30";
        const second = normalizeResponseHeaders(headers);

        expect(first["retry-after"]).toBe("120");
        expect(second["retry-after"]).toBe("30");
        expect(second).not.toBe(first);
    });

    it("reuses normalized snapshots and reads them without enumerating keys", () => {
        const headers = normalizeResponseHeaders({ "Retry-After": "120" });
        const keys = jest.spyOn(Object, "keys");
        const entries = jest.spyOn(Object, "entries");
        const reused = normalizeResponseHeaders(headers);
        const value = getResponseHeader(headers, HeaderNames.RETRY_AFTER);
        const missing = getResponseHeader(headers, "missing");
        const keyCalls = keys.mock.calls.length;
        const entryCalls = entries.mock.calls.length;
        keys.mockRestore();
        entries.mockRestore();

        expect(reused).toBe(headers);
        expect(value).toBe("120");
        expect(missing).toBeUndefined();
        expect(keyCalls).toBe(0);
        expect(entryCalls).toBe(0);
    });

    it("reads existing lowercase headers without normalizing or enumerating them", () => {
        const enumerateHeaders = jest.fn(Reflect.ownKeys);
        const headers = new Proxy<Record<string, string>>(
            {
                "retry-after": "120",
                "content-type": "application/json",
            },
            { ownKeys: enumerateHeaders }
        );

        expect(getResponseHeader(headers, HeaderNames.RETRY_AFTER)).toBe("120");
        expect(getResponseHeader(headers, HeaderNames.CONTENT_TYPE)).toBe(
            "application/json"
        );
        expect(enumerateHeaders).not.toHaveBeenCalled();
    });

    it.each(Object.values(HeaderNames))(
        "reads raw %s with case-insensitive dictionary and lookup names",
        (name) => {
            for (const headerName of [
                name,
                name.toLowerCase(),
                name.toUpperCase(),
            ]) {
                const headers = Object.freeze({
                    [headerName]: "CaseSensitiveValue",
                });

                expect(getResponseHeader(headers, name)).toBe(
                    "CaseSensitiveValue"
                );
                expect(getResponseHeader(headers, name.toLowerCase())).toBe(
                    "CaseSensitiveValue"
                );
                expect(getResponseHeader(headers, name.toUpperCase())).toBe(
                    "CaseSensitiveValue"
                );
                expect(getResponseHeader(headers, "missing")).toBeUndefined();
                expect(headers[headerName]).toBe("CaseSensitiveValue");
            }
        }
    );

    it.each(["Retry-After", "RETRY-AFTER", "rEtRy-AfTeR"])(
        "does not cache raw %s lookups",
        (headerName) => {
            const headers = { [headerName]: "120" };
            expect(getResponseHeader(headers, HeaderNames.RETRY_AFTER)).toBe(
                "120"
            );

            headers[headerName] = "30";
            expect(getResponseHeader(headers, HeaderNames.RETRY_AFTER)).toBe(
                "30"
            );
        }
    );

    it.each(Object.values(HeaderNames))(
        "reads normalized %s with case-insensitive lookup names",
        (name) => {
            const headers = normalizeResponseHeaders({
                [name.toUpperCase()]: "CaseSensitiveValue",
            });

            expect(getResponseHeader(headers, name)).toBe("CaseSensitiveValue");
            expect(getResponseHeader(headers, name.toLowerCase())).toBe(
                "CaseSensitiveValue"
            );
            expect(getResponseHeader(headers, name.toUpperCase())).toBe(
                "CaseSensitiveValue"
            );
        }
    );

    it.each(["retry-after", "Retry-After", "RETRY-AFTER", "rEtRy-AfTeR"])(
        "ignores inherited %s header values",
        (headerName) => {
            const headers: Record<string, string> = {};
            Object.setPrototypeOf(headers, { [headerName]: "120" });

            expect(
                getResponseHeader(headers, HeaderNames.RETRY_AFTER)
            ).toBeUndefined();
            expect(getResponseHeader({}, "constructor")).toBeUndefined();
        }
    );

    it("handles null-prototype dictionaries and empty values", () => {
        const headers = { "rEtRy-AfTeR": "" };
        Object.setPrototypeOf(headers, null);

        expect(getResponseHeader(headers, HeaderNames.RETRY_AFTER)).toBe("");
        expect(getResponseHeader(headers, "missing")).toBeUndefined();
    });

    it("preserves special header names without changing object prototypes", () => {
        const headers = Object.fromEntries([
            ["__proto__", "header-value"],
            ["Constructor", "another-value"],
        ]);
        const normalized = normalizeResponseHeaders(headers);

        expect(Object.getPrototypeOf(normalized)).toBe(Object.prototype);
        expect(getResponseHeader(normalized, "__proto__")).toBe("header-value");
        expect(getResponseHeader(normalized, "constructor")).toBe(
            "another-value"
        );
    });
});
