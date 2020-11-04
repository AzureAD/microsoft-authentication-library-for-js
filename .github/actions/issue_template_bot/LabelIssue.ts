import * as core from "@actions/core";
import * as github from "@actions/github";

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
    private issueNo: number;
    private token: string;
    private repoParams: RepoParamsType;
    private issueLabelConfig: IssueLabelConfigType;
    private noSelectionMadeHeaders: Array<string>
    private assignees: Set<string>;
    private labelsToAdd: Set<string>;
    private labelsToRemove: Set<string>;

    constructor(issueNo: number){
        this.token = core.getInput("token");
        this.issueNo = issueNo;
        this.issueLabelConfig = {};
        this.repoParams = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        };
        this.noSelectionMadeHeaders = [];
        this.assignees = new Set();
        this.labelsToAdd = new Set();
        this.labelsToRemove = new Set();
    }

    async parseIssue(issueBody: string) {
        await this.getConfig();
        const headerRegEx = RegExp("(##+\\s*(.*?\\n))(.*?)(?=##+|$)", "gs");
        let match: RegExpExecArray | null;
        const issueContent = new Map();

        while ((match = headerRegEx.exec(issueBody)) !== null) {
            issueContent.set(match[2].trim(), match[3]);
        }

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
        const octokit = github.getOctokit(this.token);
        const configPath = core.getInput("issue_labeler_config_path");
        const response: any = await octokit.repos.getContent({
          ...this.repoParams,
          path: configPath,
          ref: github.context.sha
        });

        const fileContents = Buffer.from(response.data.content, response.data.encoding).toString();

        try {
            this.issueLabelConfig = JSON.parse(fileContents) as IssueLabelConfigType;
        } catch (e) {
            core.setFailed("Unable to parse config file!");
            this.issueLabelConfig = {};
        }
    };

    async updateIssueLabels() {
        const octokit = github.getOctokit(this.token);

        const issueLabelResponse = await octokit.issues.listLabelsOnIssue({
            ...this.repoParams,
            issue_number: this.issueNo
        });

        const currentLabels: string[] = [];
        issueLabelResponse.data.forEach((label) => {
            currentLabels.push(label.name);
        });
        core.info(`Current Labels: ${currentLabels.join(" ")}`);

        this.labelsToRemove.forEach(async (label) => {
            if (currentLabels.includes(label)) {
                core.info(`Attempting to remove label: ${label}`)
                await octokit.issues.removeLabel({
                    ...this.repoParams,
                    issue_number: this.issueNo,
                    name: label
                });
            }
        });
    
        const labelsToAdd = Array.from(this.labelsToAdd);
        if (labelsToAdd.length > 0) {
            core.info(`Adding labels: ${Array.from(this.labelsToAdd).join(" ")}`)
            await octokit.issues.addLabels({
                ...this.repoParams,
                issue_number: this.issueNo,
                labels: labelsToAdd
            });
        }
    }

    async getLastCommentId(baseComment: string): Promise<number|null> {
        const octokit = github.getOctokit(this.token);
        const comments = await octokit.issues.listComments({
            ...this.repoParams,
            issue_number: this.issueNo
        });

        const lastComment = comments.data.pop();
        if (lastComment && lastComment.user.login === "github-actions[bot]" && lastComment.body.includes(baseComment)) {
            return lastComment.id;
        }

        return null;
    }

    async commentOnIssue() {
        const baseComment = "Invalid Selections Detected:"
        const octokit = github.getOctokit(this.token);
        const lastCommentId = await this.getLastCommentId(baseComment);
        if (this.noSelectionMadeHeaders.length <= 0) {
            core.info("All required sections contained valid selections");
            if (lastCommentId) {
                await octokit.issues.deleteComment({
                    ...this.repoParams,
                    comment_id: lastCommentId
                });
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
            await octokit.issues.updateComment({
                ...this.repoParams,
                comment_id: lastCommentId,
                body: commentLines.join("\n")
            });
        } else {
            await octokit.issues.createComment({
                ...this.repoParams,
                issue_number: this.issueNo,
                body: commentLines.join("\n")
            });
        }
    }

    async assignUsersToIssue() {
        const usernames = Array.from(this.assignees);
        if (usernames.length <= 0) {
            core.info("No Users to assign");
            return;
        }

        const octokit = github.getOctokit(this.token);
        await octokit.issues.addAssignees({
            ...this.repoParams,
            issue_number: this.issueNo,
            assignees: usernames
        });
    }
}