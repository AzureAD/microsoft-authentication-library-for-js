import sinon from "sinon";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler";
import { Logger, PublicClientApplication } from "../../src";
import { Configuration } from "../../lib";
import { LoggerOptions } from "@azure/msal-common";
import { getDefaultPerformanceClient } from "./TelemetryUtils";

const extensionId = "test-extensionId";

export async function getPublicClientApplication(configuration: Configuration): Promise<PublicClientApplication> {
    const loggerOptions: LoggerOptions = {
        loggerCallback: (): void => {},
        piiLoggingEnabled: true,
    };
    const logger: Logger = new Logger(loggerOptions);
    const providerStub: sinon.SinonStub = sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
        return new NativeMessageHandler(logger, 2000, getDefaultPerformanceClient(), extensionId);
    });

    try {
        return PublicClientApplication.createPublicClientApplication(configuration);
    } finally {
        providerStub.restore();
    }
}
