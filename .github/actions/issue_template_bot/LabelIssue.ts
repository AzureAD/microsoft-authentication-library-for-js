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

    getLibraries(labelsToSearch: string[]): Array<string> {
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

    async applyLabelsToIssue(labels: string[]) {
        const token = core.getInput("token");
        const octokit = github.getOctokit(token);
    
        await octokit.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: this.issueNo,
            labels: labels,
        });
    }

}