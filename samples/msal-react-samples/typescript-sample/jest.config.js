module.exports = {
    displayName: "TypeScript",
    globals: {
        __PORT__: 3002,
        __STARTCMD__: "npm start"
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    reporters: [
        "jest-junit", {
            "suiteName": "TypeScript E2E Tests",
            "outputDirectory": ".",
            "outputName": "junit.xml"
        }
    ]
};