import * as core from "@actions/core";
import * as github from "@actions/github";

export type RepoParamsType = {
    owner: string,
    repo: string
}

export type IssueLabelConfigType = Record<string, Record<string, string[]>>;

export class LabelIssue {
    private issueNo: number;
    private issueContent: Map<string, string>;
    private token: string;
    private repoParams: RepoParamsType;
    private issueLabelConfig: IssueLabelConfigType;

    constructor(issueNo: number, body: string){
        this.token = core.getInput("token");
        this.issueNo = issueNo;
        this.issueContent = new Map();
        this.issueLabelConfig = {};
        this.repoParams = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        };

        this.parseBody(body);
    }

    parseBody(body: string) {
        const headerRegEx = RegExp("(##\\s*(.*?\\n))(.*?)(?=##|$)", "gs");
        let match: RegExpExecArray | null;

        while ((match = headerRegEx.exec(body)) !== null) {
            this.issueContent.set(match[2].trim(), match[3]);
        }
    }

    getLabelsToAddRemove(): [Set<string>, Set<string>] {
        const labelsToAdd: Set<string> = new Set();
        const labelsToRemove: Set<string> = new Set();

        const libraryRegEx = RegExp("-\\s*\\[\\s*[xX]\\s*\\]\\s*(.*)", "g");
        let match: RegExpExecArray | null;

        Object.entries(this.issueLabelConfig).forEach(([header, value]) => {
            const issueContent = this.issueContent.get(header) || "";
            Object.entries(value).forEach(([label, searchStrings]) => {
                let labelMatched = false;
                searchStrings.forEach(searchString => {
                    while((match = libraryRegEx.exec(issueContent)) !== null) {
                        if (match[1].includes(searchString)) {
                            labelsToAdd.add(label);
                            labelMatched = true;
                            break;
                        }
                    }
                });

                if (!labelMatched) {
                    labelsToRemove.add(label);
                }
            });
        });

        return [labelsToAdd, labelsToRemove];
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
        await this.getConfig();
        const [labelsToAdd, labelsToRemove] = this.getLabelsToAddRemove();

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
    
        core.info(`Adding labels: ${labelsToAdd.toString()}`)
        await octokit.issues.addLabels({
            ...this.repoParams,
            issue_number: this.issueNo,
            labels: Array.from(labelsToAdd)
        });
    }

}