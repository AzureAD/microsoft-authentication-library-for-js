import * as core from "@actions/core";
import * as github from "@actions/github";
import { RepoParams } from "../types/RepoParams";

export class IssueBotUtils {
    public issueNo: number;
    public repoParams: RepoParams;
    public octokit;

    constructor(issueNo: number) {
        const token = core.getInput("token");
        this.issueNo = issueNo;
        this.repoParams = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        };

        this.octokit = github.getOctokit(token);
    }

    /**
     * Closes the issue
     */
    async closeIssue(): Promise<void> {
        const request = this.addRepoParams({
            issue_number: this.issueNo,
            state: "closed"
        });
        await this.octokit.issues.update(request);
    };

    /**
     * Appends the owner and repo to request object
     * @param request 
     */
    addRepoParams<T>(request: T): T & RepoParams {
        return {
            ...this.repoParams,
            ...request
        };
    }
}