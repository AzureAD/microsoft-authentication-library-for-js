const { Extractor, ExtractorConfig } = require("@microsoft/api-extractor");

const config = ExtractorConfig.prepare({
    configObject: {
        projectFolder: process.cwd(),
        mainEntryPointFilePath: "<projectFolder>/types/index.d.ts",
        compiler: { tsconfigFilePath: "<projectFolder>/tsconfig.json" },
        apiReport: { enabled: false },
        docModel: { enabled: false },
        dtsRollup: {
            enabled: true,
            untrimmedFilePath: "<projectFolder>/types/index.d.cts",
        },
        messages: {
            extractorMessageReporting: {
                "ae-missing-release-tag": { logLevel: "none" },
            },
        },
    },
    configObjectFullPath: undefined,
    packageJsonFullPath: require.resolve("../package.json"),
});
const result = Extractor.invoke(config, {
    messageCallback(message) {
        console.error(message.text);
    },
});
if (!result.succeeded) process.exitCode = 1;
