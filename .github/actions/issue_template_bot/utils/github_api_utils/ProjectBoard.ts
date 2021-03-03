import * as core from "@actions/core";
import * as github from "@actions/github";
import { RepoParams } from "../../types/RepoParams";
import { ProjectConfig } from "../../types/ProjectConfig";
import { IssueBotUtils } from "../IssueBotUtils";

export class ProjectBoard {
    private issueBotUtils: IssueBotUtils;

    constructor(issueBotUtils: IssueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }

    /**
     * Get the project id from a project name
     * @param projectName 
     */
    async getProjectId(projectName: string): Promise<number|null> {
        const response = await this.issueBotUtils.octokit.projects.listForRepo(this.issueBotUtils.repoParams);

        const project = response.data.find((project) => {
            return project.name === projectName;
        });

        return (project && project.id) || null;
    }

    /**
     * Get the columnId for a column on a project board i.e. "Todo"
     * @param projectId 
     * @param columnName 
     */
    async getProjectColumnId(projectId: number, columnName: string): Promise<number|null> {
        const request = this.issueBotUtils.addRepoParams({
            project_id: projectId
        });
        const response = await this.issueBotUtils.octokit.projects.listColumns(request);

        const column = response.data.find((column) => {
            return column.name === columnName
        });

        return (column && column.id) || null;
    }

    /**
     * Get the unique issue id (internal to github) from an issue number (external, shown on the issue page)
     */
    async getIssueId(): Promise<number|null> {
        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo
        });
        const response = await this.issueBotUtils.octokit.issues.get(request);

        return response.data.id || null;
    }

    /**
     * Determine if an issue exists on a project board
     */
    async isOnProject(columnId: number, issueId: number): Promise<boolean> {
        const issueCard = await this.getProjectCardId(columnId, issueId);
        return !!issueCard;
    }

    /**
     * Get the id for the issue card on a project board
     * @param columnId 
     * @param issueId 
     */
    async getProjectCardId(columnId: number, issueId: number): Promise<number|null> {
        const listCardsRequest = this.issueBotUtils.addRepoParams({
            column_id: columnId
        });
        const cardsResponse = await this.issueBotUtils.octokit.projects.listCards(listCardsRequest);

        const issueCard = cardsResponse.data.find(async (card) => {
            const getCardRequest = this.issueBotUtils.addRepoParams({
                card_id: card.id
            });
            const issue = await this.issueBotUtils.octokit.projects.getCard(getCardRequest);

            return issue.data.id === issueId;
        });

        return (issueCard && issueCard.id) || null;
    }

    /**
     * Add an issue to a project board
     * @param project 
     * @param issueId 
     */
    async addIssueToProject(project: ProjectConfig, issueId: number): Promise<void> {
        const projectId = await this.getProjectId(project.name);
        if (!projectId) {
            core.info(`No project id found for: ${project.name}`);
            return;
        }
        const columnId = await this.getProjectColumnId(projectId, project.column);
        if (!columnId) {
            core.info(`No column id found for ${project.column} on project ${project.name}`);
            return;
        }

        const isOnProject = await this.isOnProject(columnId, issueId);
        if (isOnProject) {
            core.info(`Already on project: ${project.name}`);
            return;
        }

        const request = this.issueBotUtils.addRepoParams({
            column_id: columnId,
            content_id: issueId,
            content_type: "Issue"
        });
        await this.issueBotUtils.octokit.projects.createCard(request);
    }

    /**
     * Remove an issue from a project board
     * @param project 
     * @param issueId 
     */
    async removeIssueFromProject(project: ProjectConfig, issueId: number): Promise<void> {
        const projectId = await this.getProjectId(project.name);
        if (!projectId) {
            core.info(`No project id found for: ${project.name}`);
            return;
        }
        const columnId = await this.getProjectColumnId(projectId, project.column);
        if (!columnId) {
            core.info(`No column id found for ${project.column} on project ${project.name}`);
            return;
        }

        const cardId = await this.getProjectCardId(columnId, issueId);
        if (!cardId) {
            core.info(`Not on project: ${project.name}`);
            return;
        }

        core.info(`Attempting to remove from project: ${project.name}`);
        const request = this.issueBotUtils.addRepoParams({
            card_id: cardId
        });
        await this.issueBotUtils.octokit.projects.deleteCard(request);
    }
}