import * as core from "@actions/core";
import { GithubUtils } from "./GithubUtils";

export class TemplateEnforcer {
    private action: string;
    private issueNo: number;
    private allTemplates: Array<Map<string, string>>;
    private githubUtils: GithubUtils;

    constructor(issueNo: number, action: string) {
        this.issueNo = issueNo;
        this.action = action;
        this.allTemplates = [];
        this.githubUtils = new GithubUtils(issueNo);
    }

    async getTemplate() {
        const currentLabels = await this.githubUtils.getCurrentLabels();
        let largestMatch = 0;
        let templateName = "";

        const templateMap = await this.githubUtils.getIssueTemplates();
        templateMap.forEach((contents, filename) => {
            this.allTemplates.push(this.githubUtils.getIssueSections(contents));
            const templateLabels = this.getLabelsFromTemplate(contents);
            const templateMatch = templateLabels.every(templateLabel => {
                return currentLabels.includes(templateLabel);
            });

            if (templateMatch && largestMatch < templateLabels.length) {
                templateName = filename;
                largestMatch = templateLabels.length;
            }
        });

        core.info(`Best Possible Template Match: ${templateName}`);
        return templateMap.get(templateName);
    }

    getLabelsFromTemplate(templateBody: string): Array<string> {
        const templateMetadataRegEx = RegExp("---.*?labels:\\s*(.*?)(?=\\n).*?---", "gs");
        let match: RegExpExecArray | null;
        const labels = [];
        while((match = templateMetadataRegEx.exec(templateBody)) !== null) {
            labels.push(...match[1].split(" "));
        }

        return labels;
    }
}