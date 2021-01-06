module.exports = {
  projects : [
    {
      displayName: "React Router",
      globals: {
          __PORT__: 3000
      },
      rootDir: "./react-router-sample",
      preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
      testEnvironment: "../../e2eTestUtils/jest-puppeteer-utils/puppeteer_environment.js"
    },
    {
      displayName: "Next.js",
      globals: {
        __PORT__: 3200
      },
      rootDir: "./nextjs-sample",
      preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
      testEnvironment: "../../e2eTestUtils/jest-puppeteer-utils/puppeteer_environment.js"
    }
  ]
};