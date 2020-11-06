import * as core from "@actions/core";
import * as github from "@actions/github";

export type RepoParamsType = {
    owner: string,
    repo: string
}
export type IssueBotConfigType = {
    selectors: IssueLabelerConfigType,
    enforceTemplate: boolean,
    optionalSections?: Array<string>,
    templateEnforcementLabel?: string,
    incompleteTemplateMessage?: string,
    noTemplateMessage?: string,
    noTemplateClose?: boolean
}
export type IssueLabelerConfigType = Record<string, HeaderConfigType>;
export type HeaderConfigType = {
    labels: Record<string, LabelConfigType>,
    enforceSelection?: boolean,
    message?: string
}
export type LabelConfigType = {
    searchStrings: Array<string>,
    assignees?: Array<string>,
    project?: ProjectConfigType
}

export type ProjectConfigType = {
    name: string,
    column: string
}

export class GithubUtils {
    private token: string;
    private issueNo: number;
    private repoParams: RepoParamsType;

    constructor(issueNo: number) {
        this.token = core.getInput("token");
        this.issueNo = issueNo;
        this.repoParams = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        };
    }

    async getLastCommentId(baseComment?: string): Promise<number|null> {
        const octokit = github.getOctokit(this.token);
        const comments = await octokit.issues.listComments({
            ...this.repoParams,
            issue_number: this.issueNo
        });

        let comment = comments.data.pop();
        while(comment) {
            if (comment.user.login === "github-actions[bot]" && (!baseComment || comment.body.includes(baseComment))) {
                return comment.id;
            }
            comment = comments.data.pop();
        }

        return null;
    }

    async addComment(comment: string) {
        const octokit = github.getOctokit(this.token);
        await octokit.issues.createComment({
            ...this.repoParams,
            issue_number: this.issueNo,
            body: comment
        });
    }

    async updateComment(commentId: number, comment: string) {
        const octokit = github.getOctokit(this.token);
        await octokit.issues.updateComment({
            ...this.repoParams,
            comment_id: commentId,
            body: comment
        });
    }

    async removeComment(commentId: number) {
        const octokit = github.getOctokit(this.token);
        await octokit.issues.deleteComment({
            ...this.repoParams,
            comment_id: commentId
        });
    }

    async assignUsersToIssue(assignees: Set<string>) {
        const usernames = Array.from(assignees);
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

    async getCurrentLabels(): Promise<Array<string>> {
        const octokit = github.getOctokit(this.token);

        const issueLabelResponse = await octokit.issues.listLabelsOnIssue({
            ...this.repoParams,
            issue_number: this.issueNo
        });

        const currentLabels: Array<string> = [];
        issueLabelResponse.data.forEach((label) => {
            currentLabels.push(label.name);
        });

        return currentLabels;
    }

    async removeIssueLabels(labelsToRemove: Array<string>, currentLabels: Array<string>) {
        const octokit = github.getOctokit(this.token);

        labelsToRemove.forEach(async (label) => {
            if (currentLabels.includes(label)) {
                core.info(`Attempting to remove label: ${label}`)
                await octokit.issues.removeLabel({
                    ...this.repoParams,
                    issue_number: this.issueNo,
                    name: label
                });
            }
        });
    }

    async addIssueLabels(labelsToAdd: Array<string>) {
        const octokit = github.getOctokit(this.token);

        if (labelsToAdd.length > 0) {
            core.info(`Adding labels: ${Array.from(labelsToAdd).join(" ")}`)
            await octokit.issues.addLabels({
                ...this.repoParams,
                issue_number: this.issueNo,
                labels: labelsToAdd
            });
        }
    }

    async updateIssueLabels(labelsToAdd: Set<string>, labelsToRemove: Set<string>) {
        const currentLabels = await this.getCurrentLabels();
        core.info(`Current Labels: ${currentLabels.join(" ")}`);

        await this.removeIssueLabels(Array.from(labelsToRemove), currentLabels);
    
        const labelsToAddArray = Array.from(labelsToAdd);
        await this.addIssueLabels(labelsToAddArray);
    }

    async getFileContents(filepath: string) {
        const octokit = github.getOctokit(this.token);
        const response: any = await octokit.repos.getContent({
          ...this.repoParams,
          path: filepath,
          ref: github.context.sha
        });

        return Buffer.from(response.data.content, response.data.encoding).toString();
    }

    async getIssueTemplates(): Promise<Map<string, string>> {
        const templateDirectory = ".github/ISSUE_TEMPLATE";
        const octokit = github.getOctokit(this.token);
        const response: any = await octokit.repos.getContent({
          ...this.repoParams,
          path: templateDirectory,
          ref: github.context.sha
        });

        const filenames: Array<string> = [];
        const templates: Map<string, string> = new Map();

        response.data.forEach((file: any) => {
            if (file.type === "file" && file.name.endsWith(".md")) {
                filenames.push(file.name);
            }
        });

        const promises = filenames.map(async (filename) => {
            const fileContents = await this.getFileContents(`${templateDirectory}/${filename}`);
            templates.set(filename, fileContents);
        });

        await Promise.all(promises);
        return templates;
    }

    getIssueSections(issueBody: string): Map<string, string> {
        const headerRegEx = RegExp("(##+\\s*(.*?\\n))(.*?)(?=##+|$)", "gs");
        let match: RegExpExecArray | null;
        const issueContent = new Map();

        while ((match = headerRegEx.exec(issueBody)) !== null) {
            issueContent.set(match[2].trim(), match[3]);
        }

        return issueContent;
    };

    async getConfig(): Promise<IssueBotConfigType|null> {
        const configPath = core.getInput("config_path");
        const fileContents = await this.getFileContents(configPath);

        try {
            return JSON.parse(fileContents) as IssueBotConfigType;
        } catch (e) {
            return null;
        }
    };

    async closeIssue(): Promise<void> {
        const octokit = github.getOctokit(this.token);
        await octokit.issues.update({
          ...this.repoParams,
          issue_number: this.issueNo,
          state: "closed"
        });
    };

    async getProjectId(projectName: string): Promise<number|null> {
        const octokit = github.getOctokit(this.token);

        const response = await octokit.projects.listForRepo({
            ...this.repoParams,
            issue_number: this.issueNo
        });

        response.data.forEach((project) => {
            if (project.name === projectName) {
                return project.id;
            }
        });

        return null;
    }

    async getProjectColumnId(projectId: number, columnName: string): Promise<number|null> {
        const octokit = github.getOctokit(this.token);

        const response = await octokit.projects.listColumns({
            ...this.repoParams,
            project_id: projectId
        });

        response.data.forEach((column) => {
            if (column.name === columnName) {
                return column.id;
            }
        });

        return null;
    }

    async addIssueToProject(project: ProjectConfigType): Promise<void> {
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

        const octokit = github.getOctokit(this.token);

        await octokit.projects.createCard({
            ...this.repoParams,
            column_id: columnId,
            content_id: this.issueNo,
            content_type: "Issue"
        });
    }
}