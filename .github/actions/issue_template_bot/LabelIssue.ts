import * as core from "@actions/core";
import { GithubUtils, IssueLabelerConfigType, ProjectConfigType } from "./GithubUtils";

export class LabelIssue {
    private issueLabelConfig: IssueLabelerConfigType;
    private noSelectionMadeHeaders: Array<string>
    private assignees: Set<string>;
    private projects: Set<ProjectConfigType>;
    private labelsToAdd: Set<string>;
    private labelsToRemove: Set<string>;
    private githubUtils: GithubUtils;

    constructor(issueNo: number, issueLabelConfig: IssueLabelerConfigType){
        this.issueLabelConfig = issueLabelConfig;
        this.noSelectionMadeHeaders = [];
        this.assignees = new Set();
        this.projects = new Set();
        this.labelsToAdd = new Set();
        this.labelsToRemove = new Set();
        this.githubUtils = new GithubUtils(issueNo);
    }

    async executeLabeler(issueBody: string): Promise<boolean> {
        await this.parseIssue(issueBody);
        await this.updateIssueLabels();
        await this.assignUsersToIssue();
        await this.commentOnIssue();
        await this.addIssueToProjects();

        // Return true if compliant, false if not compliant
        return this.noSelectionMadeHeaders.length < 1;
    }

    async parseIssue(issueBody: string) {
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

                    if (labelConfig.project) {
                        this.projects.add(labelConfig.project);
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

    async updateIssueLabels() {
        await this.githubUtils.updateIssueLabels(this.labelsToAdd, this.labelsToRemove);
    }

    async commentOnIssue() {
        const baseComment = "Invalid Selections Detected:"
        const lastCommentId = await this.githubUtils.getLastCommentId(baseComment);
        if (this.noSelectionMadeHeaders.length <= 0) {
            core.info("All required sections contained valid selections");
            if (lastCommentId) {
                core.info("Removing last comment from bot");
                await this.githubUtils.removeComment(lastCommentId);
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
            await this.githubUtils.updateComment(lastCommentId, commentLines.join("\n"));
        } else {
            core.info("Creating new comment");
            await this.githubUtils.addComment(commentLines.join("\n"));
        }
    }

    async assignUsersToIssue() {
        await this.githubUtils.assignUsersToIssue(this.assignees);
    }

    async addIssueToProjects(): Promise<void> {
        const projectArray = Array.from(this.projects);

        const issueId = await this.githubUtils.getIssueId();
        if (!issueId) {
            core.info(`No issue id found!`);
            return;
        }

        const promises = projectArray.map(async (project) => {
            await this.githubUtils.addIssueToProject(project, issueId);
        });

        await Promise.all(promises);
    }
}