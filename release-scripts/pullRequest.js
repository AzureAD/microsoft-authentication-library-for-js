/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { Octokit } = require("@octokit/rest");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

const titleDate = argv.titleDate;
const branch = argv.branch;

const octokit = new Octokit({
  auth: process.env.GITHUBTOKEN
})

octokit.request("POST /repos/AzureAD/microsoft-authentication-library-for-js/pulls", {
  owner: "AzureAD",
  repo: "microsoft-authentication-library-for-js",
  title: `${titleDate} Post Release`,
  body: "This PR contains package lock updates for all published packages.",
  head: branch,
  base: "dev"
}).then((response) => {
  if (response.status >= 200 && response.status < 300) {
    console.log("Pull Request created successfully");
    process.exit(0);
  } else {
    process.exit(1);
  }
})
