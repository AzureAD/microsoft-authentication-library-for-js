import * as core from "@actions/core";
import * as github from "@actions/github";

export type RepoParamsType = {
    owner: string,
    repo: string
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

        const lastComment = comments.data.pop();
        if (lastComment && lastComment.user.login === "github-actions[bot]" && (!baseComment || lastComment.body.includes(baseComment))) {
            return lastComment.id;
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

    async updateIssueLabels(labelsToAdd: Set<string>, labelsToRemove: Set<string>) {
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
    
        const labelsToAddArray = Array.from(labelsToAdd);
        if (labelsToAddArray.length > 0) {
            core.info(`Adding labels: ${Array.from(labelsToAddArray).join(" ")}`)
            await octokit.issues.addLabels({
                ...this.repoParams,
                issue_number: this.issueNo,
                labels: labelsToAddArray
            });
        }
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
        const octokit = github.getOctokit(this.token);
        const response: any = await octokit.repos.getContent({
          ...this.repoParams,
          path: ".github/ISSUE_TEMPLATE",
          ref: github.context.sha
        });

        const templates: Map<string, string> = new Map();

        response.data.forEach((file: any) => {
            core.info(JSON.stringify(file));
            if (file.type === "file" && file.name.endsWith(".md")) {
                const fileContent = Buffer.from(file.content, file.encoding).toString();
                templates.set(file.name, fileContent);
            }
        })

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
}