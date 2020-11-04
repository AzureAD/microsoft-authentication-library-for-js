import * as core from "@actions/core";
import * as github from "@actions/github";
import { GithubUtils } from "./GithubUtils";

export type RepoParamsType = {
    owner: string,
    repo: string
}

export type IssueLabelConfigType = Record<string, HeaderConfigType>;
export type HeaderConfigType = {
    labels: Record<string, LabelConfigType>,
    enforceSelection?: boolean,
    message?: string
};

export type LabelConfigType = {
    searchStrings: Array<string>,
    assignees?: Array<string>
}

export class LabelIssue {
    private issueLabelConfig: IssueLabelConfigType;
    private noSelectionMadeHeaders: Array<string>
    private assignees: Set<string>;
    private labelsToAdd: Set<string>;
    private labelsToRemove: Set<string>;
    private githubUtils: GithubUtils;

    constructor(issueNo: number){
        this.issueLabelConfig = {};
        this.noSelectionMadeHeaders = [];
        this.assignees = new Set();
        this.labelsToAdd = new Set();
        this.labelsToRemove = new Set();
        this.githubUtils = new GithubUtils(issueNo);
    }

    async parseIssue(issueBody: string) {
        await this.getConfig();
        const issueContent = this.githubUtils.getIssueSections(issueBody);

        Object.entries(this.issueLabelConfig).forEach(([header, value]) => {
            const headerContent = issueContent.get(header) || "";
            if (headerContent.trim() === "") {
                core.info(`No Content found for header: ${header}`);
                return;
            }

            core.info(`${header} Content: ${headerContent}`);
            const labels = value.labels;
            let labelFoundForHeader = false;
            Object.entries(labels).forEach(([label, labelConfig]) => {
                core.info(`Checking label: ${label}`);
                let labelMatched = false;
                labelConfig.searchStrings.every(searchString => {
                    core.info(`Searching string: ${searchString}`);
                    const libraryRegEx = RegExp("-\\s*\\[\\s*[xX]\\s*\\]\\s*(.*)", "g");
                    let match: RegExpExecArray | null;
                    while((match = libraryRegEx.exec(headerContent)) !== null) {
                        if (match[1].includes(searchString)) {
                            labelMatched = true;
                            break;
                        }
                    }

                    return !labelMatched;
                });

                if (labelMatched) {
                    core.info("Found!");
                    labelFoundForHeader = true;
                    this.labelsToAdd.add(label);
                    if (labelConfig.assignees) {
                        labelConfig.assignees.forEach((username) => {
                            this.assignees.add(username);
                        });
                    }
                } else {
                    core.info(`Not Found!`);
                    this.labelsToRemove.add(label);
                }
            });

            if (!labelFoundForHeader && value.enforceSelection) {
                this.noSelectionMadeHeaders.push(header);
            }
        });
    }

    async getConfig(): Promise<void> {
        const configPath = core.getInput("issue_labeler_config_path");
        const fileContents = await this.githubUtils.getFileContents(configPath);

        try {
            this.issueLabelConfig = JSON.parse(fileContents) as IssueLabelConfigType;
        } catch (e) {
            core.setFailed("Unable to parse config file!");
            this.issueLabelConfig = {};
        }
    };

    async updateIssueLabels() {
        this.githubUtils.updateIssueLabels(this.labelsToAdd, this.labelsToRemove);
    }

    async commentOnIssue() {
        const baseComment = "Invalid Selections Detected:"
        const lastCommentId = await this.githubUtils.getLastCommentId(baseComment);
        if (this.noSelectionMadeHeaders.length <= 0) {
            core.info("All required sections contained valid selections");
            if (lastCommentId) {
                core.info("Removing last comment from bot");
                this.githubUtils.removeComment(lastCommentId);
            }
            return;
        }

        let commentLines = [baseComment]

        this.noSelectionMadeHeaders.forEach((header) => {
            const headerConfig = this.issueLabelConfig[header];
            if (headerConfig.enforceSelection && headerConfig.message) {
                commentLines.push(headerConfig.message);
            }
        });

        if (lastCommentId) {
            core.info("Updating last comment from bot");
            this.githubUtils.updateComment(lastCommentId, commentLines.join("\n"));
        } else {
            core.info("Creating new comment");
            this.githubUtils.addComment(commentLines.join("\n"));
        }
    }

    async assignUsersToIssue() {
        this.githubUtils.assignUsersToIssue(this.assignees);
    }
}