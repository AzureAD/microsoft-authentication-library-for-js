import * as UrlUtils from "../../src/utils/UrlUtils";

describe("UrlUtils.ts Class Unit Tests", () => {
    describe("stripLeadingHashOrQuery Tests", () => {
        it("strips leading # if present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("#value")).toEqual("value");
        });

        it("strips leading ? if present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("?value")).toEqual("value");
        });

        it("strips leading #/ if present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("#/value")).toEqual(
                "value"
            );
        });

        it("returns input as-is if # or ? are not present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("value")).toEqual("value");
        });
    });

    describe("getDeserializedResponse Tests", () => {
        it("getDeserializedResponse returns object if hash contains known properties", () => {
            expect(UrlUtils.getDeserializedResponse("#code=value")).toEqual({
                code: "value",
            });
            expect(UrlUtils.getDeserializedResponse("#state=value")).toEqual({
                state: "value",
            });
            expect(UrlUtils.getDeserializedResponse("#error=value")).toEqual({
                error: "value",
            });
            expect(
                UrlUtils.getDeserializedResponse("#error_description=value")
            ).toEqual({ error_description: "value" });
        });

        it("getDeserializedResponse returns object if query string contains known properties", () => {
            expect(UrlUtils.getDeserializedResponse("?code=value")).toEqual({
                code: "value",
            });
            expect(UrlUtils.getDeserializedResponse("?state=value")).toEqual({
                state: "value",
            });
            expect(UrlUtils.getDeserializedResponse("?error=value")).toEqual({
                error: "value",
            });
            expect(
                UrlUtils.getDeserializedResponse("?error_description=value")
            ).toEqual({ error_description: "value" });
        });

        it("getDeserializedResponse returns the hash as a deserialized object", () => {
            const serializedHash =
                "#code=value1&state=value2&client_info=value3";
            const deserializedHash = {
                code: "value1",
                state: "value2",
                client_info: "value3",
            };

            expect(UrlUtils.getDeserializedResponse(serializedHash)).toEqual(
                deserializedHash
            );
        });

        it("getDeserializedResponse returns the queryString as a deserialized object", () => {
            const serializedHash =
                "?code=value1&state=value2&client_info=value3";
            const deserializedHash = {
                code: "value1",
                state: "value2",
                client_info: "value3",
            };

            expect(UrlUtils.getDeserializedResponse(serializedHash)).toEqual(
                deserializedHash
            );
        });

        it("getDeserializedResponse returns null if key/value is undefined", () => {
            expect(UrlUtils.getDeserializedResponse("#")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("?")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("#=value1")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("?=value1")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("#key1=")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("?key1=")).toBe(null);
        });
    });
});
