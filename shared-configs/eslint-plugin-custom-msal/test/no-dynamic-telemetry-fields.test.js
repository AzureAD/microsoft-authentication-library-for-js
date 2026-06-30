const { RuleTester } = require("eslint");
const noDynamicTelemetryFields = require("../rules/no-dynamic-telemetry-fields");

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
});

ruleTester.run("no-dynamic-telemetry-fields", noDynamicTelemetryFields, {
    valid: [
        // Static literal keys that ARE valid PerformanceEvent fields
        {
            code: `telemetryClient.incrementFields({ visibilityChangeCount: 1 }, correlationId);`,
        },
        {
            code: `telemetryClient.addFields({ fromCache: true }, correlationId);`,
        },
        {
            code: `inProgressEvent.add({ errorCode: "invalid_grant" });`,
        },
        {
            code: `inProgressEvent.increment({ multiMatchedAT: 1 });`,
        },
        {
            code: `telemetryClient.addFields({ correlationId: "abc-123" }, id);`,
        },
        {
            code: `telemetryClient.addFields({ durationMs: 500, success: true }, id);`,
        },
        // Computed keys with "ext." prefix are allowed
        {
            code: "telemetryClient.incrementFields({ [`ext.${eventName}CallCount`]: 1 }, correlationId);",
        },
        {
            code: 'telemetryClient.addFields({ ["ext." + eventName + "Duration"]: 500 }, correlationId);',
        },
        {
            code: 'telemetryClient.incrementFields({ ["ext.someField"]: 1 }, correlationId);',
        },
        // Non-telemetry method calls with computed keys are allowed
        {
            code: `someObject.someMethod({ [dynamicKey]: 1 });`,
        },
        {
            code: `map.set({ [key]: value });`,
        },
        // Non-telemetry method calls with any static keys are allowed (no validation)
        {
            code: `someObject.someMethod({ totallyFakeField: 1 });`,
        },
        // Direct assignment on non-event variables is allowed
        {
            code: `someObject[dynamicKey] = 5;`,
        },
        {
            code: `config[settingName] = true;`,
        },
        // Direct assignment on event variables using "ext" sub-object is allowed (static property)
        {
            code: `rootEvent.ext = {};`,
        },
        // Direct computed assignment on event.ext[key] is allowed
        {
            code: `rootEvent.ext[fieldName] = 42;`,
        },
        {
            code: `perfEvent.ext["someKey"] = "value";`,
        },
        // Non-computed string-literal keys starting with "ext." are allowed (routed at runtime)
        {
            code: `telemetryClient.addFields({ "ext.customField": 500 }, correlationId);`,
        },
        {
            code: `inProgressEvent.add({ "ext.myCounter": 1 });`,
        },
        // Spread elements in telemetry calls are fine
        {
            code: `telemetryClient.addFields({ ...otherFields }, correlationId);`,
        },
        // Fields from additionalAllowedFields option are allowed
        {
            code: `telemetryClient.addFields({ customOnePField: "value" }, id);`,
            options: [{ additionalAllowedFields: ["customOnePField"] }],
        },
        // Multiple valid fields in one call
        {
            code: `telemetryClient.addFields({ correlationId: "abc", httpStatus: 200, success: true }, id);`,
        },
        // Global telemetry fields are validated like addFields — valid PerformanceEvent field
        {
            code: `telemetryClient.addGlobalFields({ previousLibraryVersion: "1.0.0" });`,
        },
        {
            code: `this.performanceClient.addGlobalFields({ libraryVersion: version });`,
        },
    ],
    invalid: [
        // Computed keys without "ext." prefix in telemetry calls
        {
            code: `const eventCount = eventName + "CallCount"; telemetryClient.incrementFields({ [eventCount]: 1 }, correlationId);`,
            errors: [
                {
                    messageId: "noDynamicFields",
                },
            ],
        },
        {
            code: 'telemetryClient.incrementFields({ [eventName + "CallCount"]: 1 }, correlationId);',
            errors: [
                {
                    messageId: "noDynamicFields",
                },
            ],
        },
        {
            code: "telemetryClient.addFields({ [`${eventName}DurationMs`]: 50 }, correlationId);",
            errors: [
                {
                    messageId: "noDynamicFields",
                },
            ],
        },
        {
            code: `inProgressEvent.increment({ [fieldName]: 1 });`,
            errors: [
                {
                    messageId: "noDynamicFields",
                },
            ],
        },
        {
            code: `inProgressEvent.add({ [name + "Size"]: 100 });`,
            errors: [
                {
                    messageId: "noDynamicFields",
                },
            ],
        },
        // Direct indexed assignment on event-like variables
        {
            code: `rootEvent[event.name + "DurationMs"] = Math.floor(event.durationMs);`,
            errors: [
                {
                    messageId: "noDynamicAssignment",
                },
            ],
        },
        {
            code: `perfEvent[dynamicKey] = value;`,
            errors: [
                {
                    messageId: "noDynamicAssignment",
                },
            ],
        },
        {
            code: `finalEvent[name + "Count"] = 5;`,
            errors: [
                {
                    messageId: "noDynamicAssignment",
                },
            ],
        },
        // Computed assignment with ext. prefix on event object itself is still invalid
        // (should use event.ext[key] instead)
        {
            code: `perfEvent["ext.someKey"] = 1;`,
            errors: [
                {
                    messageId: "noDynamicAssignment",
                },
            ],
        },
        {
            code: "rootEvent[`ext.${name}`] = value;",
            errors: [
                {
                    messageId: "noDynamicAssignment",
                },
            ],
        },
        // Static keys that are NOT valid PerformanceEvent fields (typos, made-up names)
        {
            code: `telemetryClient.addFields({ correlationIdd: "value" }, id);`,
            errors: [
                {
                    messageId: "unknownStaticField",
                    data: { name: "correlationIdd", method: "addFields" },
                },
            ],
        },
        {
            code: `inProgressEvent.add({ fakeField: 123 });`,
            errors: [
                {
                    messageId: "unknownStaticField",
                    data: { name: "fakeField", method: "add" },
                },
            ],
        },
        {
            code: `telemetryClient.incrementFields({ durrationMs: 1 }, id);`,
            errors: [
                {
                    messageId: "unknownStaticField",
                    data: { name: "durrationMs", method: "incrementFields" },
                },
            ],
        },
        // Mix of valid and invalid static keys — only the invalid one is reported
        {
            code: `telemetryClient.addFields({ correlationId: "abc", notARealField: true }, id);`,
            errors: [
                {
                    messageId: "unknownStaticField",
                    data: { name: "notARealField", method: "addFields" },
                },
            ],
        },
        // String literal key that is not a valid field
        {
            code: `telemetryClient.addFields({ "badFieldName": 42 }, id);`,
            errors: [
                {
                    messageId: "unknownStaticField",
                    data: { name: "badFieldName", method: "addFields" },
                },
            ],
        },
        // Global telemetry fields are validated too — unknown static field
        {
            code: `telemetryClient.addGlobalFields({ notARealGlobalField: "value" });`,
            errors: [
                {
                    messageId: "unknownStaticField",
                    data: {
                        name: "notARealGlobalField",
                        method: "addGlobalFields",
                    },
                },
            ],
        },
        // Global telemetry fields — computed key without "ext." prefix
        {
            code: 'telemetryClient.addGlobalFields({ [fieldName + "Version"]: "1.0.0" });',
            errors: [
                {
                    messageId: "noDynamicFields",
                },
            ],
        },
    ],
});

console.log("All no-dynamic-telemetry-fields tests passed!");
