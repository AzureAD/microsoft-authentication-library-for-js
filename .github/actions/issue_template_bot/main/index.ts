import * as core from "@actions/core";
import * as github from "@actions/github";
import { IssueBotUtils } from "../utils/IssueBotUtils";
import { RepoFiles } from "../utils/github_api_utils/RepoFiles";
import { IssueManager } from "./IssueManager";
import { TemplateEnforcer } from "./TemplateEnforcer";
import { IssueLabels } from "../utils/github_api_utils/IssueLabels";

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
        const issueBotUtils = new IssueBotUtils(issue.number);
        const repoFiles = new RepoFiles(issueBotUtils);
        const config = await repoFiles.getConfig();
        if (!config) {
            core.setFailed("Unable to parse config file!");
            return;
        }

        core.info("Start Template Enforcer");
        const templateEnforcer = new TemplateEnforcer(issue.number, payload.action);
        const isTemplateComplete = await templateEnforcer.enforceTemplate(issue.body, config);

        core.info("Start Issue Manager");
        const issueManager = new IssueManager(issue.number, config.selectors);
        const isSelectionMade = await issueManager.updateIssue(issue.body);


        // Add/remove enforcement label
        if (config.enforceTemplate && config.templateEnforcementLabel) {
            const issueLabels = new IssueLabels(issueBotUtils);
            if (isTemplateComplete && isSelectionMade) {
                const currentLabels = await issueLabels.getCurrentLabels();
                await issueLabels.removeLabels([config.templateEnforcementLabel], currentLabels);
            } else {
                await issueLabels.addLabels([config.templateEnforcementLabel]);
            }
        }
    } else {
        core.setFailed("No issue number or body available, cannot label issue!");
        return;
    }
}

run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));
