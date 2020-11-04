import * as core from "@actions/core";
import { GithubUtils } from "./GithubUtils";

export class TemplateEnforcer {
    private issueNo: number;
    private templates: Array<Map<string, string>>;
    private githubUtils: GithubUtils;

    constructor(issueNo: number) {
        this.issueNo = issueNo;
        this.templates = [];
        this.githubUtils = new GithubUtils(issueNo);
    }

    async getTemplates() {
        const templateMap = await this.githubUtils.getIssueTemplates();
        core.info(`Trying: ${templateMap.get("question.md")}`);
        templateMap.forEach((contents, filename) => {
            core.info(`Reading: ${filename}`);
        });
    }
}