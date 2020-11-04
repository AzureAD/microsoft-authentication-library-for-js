import * as core from "@actions/core";
import * as github from "@actions/github";
import { LabelIssue } from "./LabelIssue";

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

    if (issue.number && issue.body) {
        const labelIssue = new LabelIssue(issue.number, issue.body);
        await labelIssue.updateIssueLabels();
    } else {
        core.setFailed("No issue number or body available, cannot label issue!");
    }
}

run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));
