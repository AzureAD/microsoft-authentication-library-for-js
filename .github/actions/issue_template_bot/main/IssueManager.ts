import * as core from "@actions/core";
import { IssueBotUtils } from "../utils/IssueBotUtils";
import { ProjectBoard } from "../utils/github_api_utils/ProjectBoard";
import { IssueLabelerConfig } from "../types/IssueLabelerConfig";
import { ProjectConfig } from "../types/ProjectConfig";
import { StringUtils } from "../utils/StringUtils";
import { IssueLabels } from "../utils/github_api_utils/IssueLabels";
import { IssueComments } from "../utils/github_api_utils/IssueComments";
import { IssueAssignees } from "../utils/github_api_utils/IssueAssignees";

export class IssueManager {
    private issueLabelConfig: IssueLabelerConfig;
    private noSelectionMadeHeaders: Array<string>
    private assignees: Set<string>;
    private projectsToAdd: Set<ProjectConfig>;
    private allProjects: Set<ProjectConfig>;
    private labelsToAdd: Set<string>;
    private labelsToRemove: Set<string>;
    private issueBotUtils: IssueBotUtils;
    private projectBoard: ProjectBoard;
    private issueLabels: IssueLabels;
    private issueComments: IssueComments;
    private issueAssignees: IssueAssignees;

    constructor(issueNo: number, issueLabelConfig: IssueLabelerConfig){
        this.issueLabelConfig = issueLabelConfig;
        this.noSelectionMadeHeaders = [];
        this.assignees = new Set();
        this.projectsToAdd = new Set();
        this.allProjects = new Set();
        this.labelsToAdd = new Set();
        this.labelsToRemove = new Set();

        this.issueBotUtils = new IssueBotUtils(issueNo);
        this.projectBoard = new ProjectBoard(this.issueBotUtils);
        this.issueLabels = new IssueLabels(this.issueBotUtils);
        this.issueComments = new IssueComments(this.issueBotUtils);
        this.issueAssignees = new IssueAssignees(this.issueBotUtils);
    }

    async updateIssue(issueBody: string): Promise<boolean> {
        await this.parseIssue(issueBody);
        await this.updateIssueLabels();
        await this.assignUsersToIssue();
        await this.commentOnIssue();
        await this.updateIssueProjects();

        // Return true if compliant, false if not compliant
        return this.noSelectionMadeHeaders.length < 1;
    }

    /**
     * Parse the issue to determine what labels need to be added/removed, users assigned and projects the issue should belong to
     * @param issueBody 
     */
    private async parseIssue(issueBody: string) {
        const issueContent = StringUtils.getIssueSections(issueBody);

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
                        this.projectsToAdd.add(labelConfig.project);
                    }
                } else {
                    core.info(`Not Found!`);
                    this.labelsToRemove.add(label);
                }

                if (labelConfig.project) {
                    this.allProjects.add(labelConfig.project);
                }
            });

            if (!labelFoundForHeader && value.enforceSelection) {
                this.noSelectionMadeHeaders.push(header);
            }
        });
    }

    /**
     * Update the issue labels
     */
    private async updateIssueLabels() {
        await this.issueLabels.updateLabels(this.labelsToAdd, this.labelsToRemove);
    }

    /**
     * Update bot comment on issue
     */
    private async commentOnIssue() {
        const baseComment = "Invalid Selections Detected:"
        const lastCommentId = await this.issueComments.getLastCommentId(baseComment);
        if (this.noSelectionMadeHeaders.length <= 0) {
            core.info("All required sections contained valid selections");
            if (lastCommentId) {
                core.info("Removing last comment from bot");
                await this.issueComments.removeComment(lastCommentId);
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
            await this.issueComments.updateComment(lastCommentId, commentLines.join("\n"));
        } else {
            core.info("Creating new comment");
            await this.issueComments.addComment(commentLines.join("\n"));
        }
    }

    /**
     * Assign users to issue
     */
    private async assignUsersToIssue() {
        await this.issueAssignees.assignUsersToIssue(this.assignees);
    }

    /**
     * Add issue to project board
     */
    private async updateIssueProjects(): Promise<void> {
        const projects = Array.from(this.allProjects);

        const issueId = await this.projectBoard.getIssueId();
        if (!issueId) {
            core.info(`No issue id found!`);
            return;
        }

        const promises = projects.map(async (project) => {
            if (this.projectsToAdd.has(project)) {
                await this.projectBoard.addIssueToProject(project, issueId);
            } else {
                await this.projectBoard.removeIssueFromProject(project, issueId);
            }
        });

        await Promise.all(promises);
    }
}