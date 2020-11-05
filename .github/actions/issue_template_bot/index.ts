import * as core from "@actions/core";
import * as github from "@actions/github";
import { GithubUtils } from "./GithubUtils";
import { LabelIssue } from "./LabelIssue";
import { TemplateEnforcer } from "./TemplateEnforcer";

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
        const githubUtils = new GithubUtils(issue.number);
        const config = await githubUtils.getConfig();
        if (!config) {
            core.setFailed("Unable to parse config file!");
            return;
        }

        core.info("Start Template Enforcer");
        const templateEnforcer = new TemplateEnforcer(issue.number, payload.action);
        const isTemplateComplete = await templateEnforcer.enforceTemplate(issue.body, config);

        core.info("Start selection detection");
        const labelIssue = new LabelIssue(issue.number, config.labeler);
        const isSelectionMade = await labelIssue.executeLabeler(issue.body);


        // Add/remove enforcement label
        if (config.enforceTemplate && config.templateEnforcementLabel) {
            if (isTemplateComplete && isSelectionMade) {
                const currentLabels = await githubUtils.getCurrentLabels();
                await githubUtils.removeIssueLabels([config.templateEnforcementLabel], currentLabels);
            } else {
                await githubUtils.addIssueLabels([config.templateEnforcementLabel]);
            }
        }
    } else {
        core.setFailed("No issue number or body available, cannot label issue!");
        return;
    }
}

run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));
