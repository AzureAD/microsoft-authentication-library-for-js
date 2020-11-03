import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
    core.info("START");
    core.info(github.context.eventName);
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

    core.info(`Issue number: ${issue.number}`);
    core.info(`Issue body: ${issue.body}`);
}

run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));
