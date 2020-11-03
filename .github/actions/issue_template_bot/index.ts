import * as core from "@actions/core";
import * as github from "@actions/github";
import { LabelLibrary } from "./LabelLibrary";

async function run() {
    core.info(`Event of type: ${github.context.eventName} triggered workflow`);
    if (github.context.eventName !== "issues") {
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

    if (issue.number && issue.body) {
        LabelLibrary(issue.number, issue.body);
    } else {
        core.setFailed("No issue number or body available, cannot label issue!");
    }
}

run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));
