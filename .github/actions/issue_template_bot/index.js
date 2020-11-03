"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
async function run() {
    if (github.context.eventName !== "issue") {
        core.setFailed("Can only run on issues!");
        return;
    }
    const payload = github.context.payload;
    if (!payload) {
        core.setFailed("No payload!");
        return;
    }
    const issue = payload.issue;
    if (!issue) {
        core.setFailed("No issue on payload!");
        return;
    }
    console.log(`Issue number: ${issue.number}`);
    console.log(`Issue body: ${issue.body}`);
}
run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));
