module.exports = {
    displayName: "React B2C",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "npm start"
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    reporters: [
        "jest-junit", {
            "suiteName": "React B2C E2E Tests",
            "outputDirectory": ".",
            "outputName": "junit.xml"
        }
    ]
};