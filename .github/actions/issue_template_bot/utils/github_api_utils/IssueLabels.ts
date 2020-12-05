import * as core from "@actions/core";
import { IssueBotUtils } from "../IssueBotUtils";

export class IssueLabels {
    private issueBotUtils: IssueBotUtils;

    constructor(issueBotUtils: IssueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }

    async getCurrentLabels(): Promise<Array<string>> {
        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo
        });
        const issueLabelResponse = await this.issueBotUtils.octokit.issues.listLabelsOnIssue(request);

        const currentLabels: Array<string> = [];
        issueLabelResponse.data.forEach((label) => {
            currentLabels.push(label.name);
        });

        return currentLabels;
    }

    async removeLabels(labelsToRemove: Array<string>, currentLabels: Array<string>) {
        labelsToRemove.forEach(async (label) => {
            if (currentLabels.includes(label)) {
                core.info(`Attempting to remove label: ${label}`)
                const request = this.issueBotUtils.addRepoParams({
                    issue_number: this.issueBotUtils.issueNo,
                    name: label
                });
                await this.issueBotUtils.octokit.issues.removeLabel(request);
            }
        });
    }

    async addLabels(labelsToAdd: Array<string>) {
        if (labelsToAdd.length > 0) {
            core.info(`Adding labels: ${Array.from(labelsToAdd).join(" ")}`)
            const request = this.issueBotUtils.addRepoParams({
                issue_number: this.issueBotUtils.issueNo,
                labels: labelsToAdd
            })
            await this.issueBotUtils.octokit.issues.addLabels(request);
        }
    }

    async updateLabels(labelsToAdd: Set<string>, labelsToRemove: Set<string>) {
        const currentLabels = await this.getCurrentLabels();
        core.info(`Current Labels: ${currentLabels.join(" ")}`);

        await this.removeLabels(Array.from(labelsToRemove), currentLabels);
    
        const labelsToAddArray = Array.from(labelsToAdd);
        await this.addLabels(labelsToAddArray);
    }
}