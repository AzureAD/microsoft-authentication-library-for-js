import { expect } from "chai";
import { buildConfiguration, Configuration } from '../../src/Configuration';

describe("Configuation.ts", () => {
    it("buildConfiguration defaults", () => {
        const config: Configuration = {
            auth: {
                clientId: 'iamnotreal'
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        console.log(configWithDefaults);
    });
})