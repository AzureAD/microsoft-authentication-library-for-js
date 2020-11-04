import * as core from "@actions/core";
import * as github from "@actions/github";

export class LabelIssue {
    private issueNo: number;
    private issueContent: Map<string, string>;

    constructor(issueNo: number, body: string){
        this.issueNo = issueNo;
        this.issueContent = new Map();

        this.parseBody(body);
    }

    parseBody(body: string) {
        const headerRegEx = RegExp("(##\\s*(.*?\\n))(.*?)(?=##|$)", "gs");
        let match: RegExpExecArray | null;

        while ((match = headerRegEx.exec(body)) !== null) {
            this.issueContent.set(match[2].trim(), match[3]);
        }
    }

    getLibraries(): Array<string> {
        const labelsToSearch = core.getInput("libraries").split(" ");
        const librariesFound: string[] = [];
        const librarySelections = this.issueContent.get("Library") || "";

        const libraryRegEx = RegExp("-\\s*\\[\\s*[xX]\\s*\\]\\s*(.*)", "g");
        let match: RegExpExecArray | null;

        labelsToSearch.forEach(label => {
            while((match = libraryRegEx.exec(librarySelections)) !== null) {
                if (match[1].includes(label)) {
                    librariesFound.push(label);
                    break;
                }
            }
        });

        return librariesFound;
    }

    async updateIssueLabels(librariesAffected: string[]) {
        const token = core.getInput("token");
        const octokit = github.getOctokit(token);
        const labelsToCheck = core.getInput("libraries").split(" ");
        const labelsToAdd: string[] = [];

        const issueLabelResponse = await octokit.issues.listLabelsOnIssue({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: this.issueNo
        });

        const currentLabels: string[] = [];
        issueLabelResponse.data.forEach((label) => {
            currentLabels.push(label.name);
        });
        core.info(`Current Labels: ${currentLabels.join(" ")}`)

        labelsToCheck.forEach(async (label) => {
            if (currentLabels.includes(label) && !librariesAffected.includes(label)) {
                core.info(`Attempting to remove label: ${label}`)
                await octokit.issues.removeLabel({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: this.issueNo,
                    name: label
                });
            } else if (!currentLabels.includes(label) && librariesAffected.includes(label)) {
                labelsToAdd.push(label);
            }
        });
    
        core.info(`Adding labels: ${labelsToAdd.join(" ")}`)
        await octokit.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: this.issueNo,
            labels: labelsToAdd,
        });
    }

}