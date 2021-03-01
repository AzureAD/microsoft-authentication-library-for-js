import * as core from "@actions/core";
import { IssueBotUtils } from "../IssueBotUtils";

export class IssueAssignees {
    private issueBotUtils: IssueBotUtils;

    constructor(issueBotUtils: IssueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }

    /**
     * Assigns the provided users to the issue
     * @param assignees 
     */
    async assignUsersToIssue(assignees: Set<string>) {
        const usernames = Array.from(assignees);
        if (usernames.length <= 0) {
            core.info("No Users to assign");
            return;
        }

        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo,
            assignees: usernames
        });
        await this.issueBotUtils.octokit.issues.addAssignees(request);
    }
}