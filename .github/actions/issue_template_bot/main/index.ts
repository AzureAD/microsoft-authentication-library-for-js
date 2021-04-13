import * as core from "@actions/core";
import * as github from "@actions/github";
import { IssueBotUtils } from "../utils/IssueBotUtils";
import { RepoFiles } from "../utils/github_api_utils/RepoFiles";
import { IssueManager } from "./IssueManager";
import { TemplateEnforcer } from "./TemplateEnforcer";

/**
 * Entry point for the issue template bot
 */
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

    try {
        core.debug(`Issue Payload: ${JSON.stringify(payload)}`);
    } catch (e) {}

    if (payload.changes && !!payload.changes.old_issue) {
        core.info("This issue was transferred from another repository. Skipping.");
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

        // Get the issue bot config
        const config = await repoFiles.getConfig();
        if (!config) {
            core.setFailed("Unable to parse config file!");
            return;
        }

        if (config.ignoreIssuesOpenedBefore) {
            try {
                const createDate = Date.parse(issue.created_at);
                const ignoreBeforeDate = Date.parse(config.ignoreIssuesOpenedBefore);
                if (createDate < ignoreBeforeDate) {
                    core.info(`Ignoring issue due to configuration. Issue created at: ${issue.created_at}`);
                    return;
                }
            } catch (e) {
                core.error(`Error Occurred when parsing dates: ${e}`);
                return;
            }
        }

        // Ensure a template was used and filled out
        core.info("Start Template Enforcer");
        const templateEnforcer = new TemplateEnforcer(issue.number, payload.action);
        const closed = await templateEnforcer.enforceTemplate(issue.body, config);

        if (closed) {
            return;
        }

        // Label, assign, comment on issue based on content in the issue body
        core.info("Start Issue Manager");
        const issueManager = new IssueManager(issue.number, config.selectors);
        await issueManager.updateIssue(issue.body);
    } else {
        core.setFailed("No issue number or body available, cannot label issue!");
        return;
    }
}

run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));
