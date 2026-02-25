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
        // Static literal keys in telemetry calls are allowed
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
        // Spread elements in telemetry calls are fine
        {
            code: `telemetryClient.addFields({ ...otherFields }, correlationId);`,
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
    ],
});

console.log("All no-dynamic-telemetry-fields tests passed!");
