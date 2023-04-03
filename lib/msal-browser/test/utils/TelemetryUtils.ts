import { Logger, ApplicationTelemetry, IPerformanceClient } from "@azure/msal-common";
import { name, version } from "../../src/packageMetadata";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient";

const clientId = "test-client-id";
const authority = "https://login.microsoftonline.com";
const logger = new Logger({});
const applicationTelemetry: ApplicationTelemetry = {
    appName: "Test App",
    appVersion: "1.0.0-test.0"
}
const cryptoOptions = {
    useMsrCrypto: false,
    entropy: undefined
}

export function getDefaultPerformanceClient(): IPerformanceClient {
    return new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);
}
