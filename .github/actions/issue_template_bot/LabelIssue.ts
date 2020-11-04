import * as core from "@actions/core";

export class LabelIssue {
    private issueNo: number;
    private issueContent: Map<string, string>;

    constructor(issueNo: number, body: string){
        this.issueNo = issueNo;
        this.issueContent = new Map();

        this.parseBody(body);
    }

    parseBody(body: string) {
        const headerRegEx = RegExp("(##\s*(.*?\n))(.*?)(?=##|$)", "gs");
        let match: RegExpExecArray | null;

        while ((match = headerRegEx.exec(body)) !== null) {
            this.issueContent.set(match[2].trim(), match[3]);
        }
    }

    getLibraries(labelsToSearch: string[]): Array<string> {
        const librariesFound: string[] = [];
        const librarySelections = this.issueContent.get("Library") || "";

        const libraryRegEx = RegExp(".*", "g");
        let match: RegExpExecArray | null;

        labelsToSearch.forEach(label => {
            core.info(`Attempting to match: ${label}`);
            core.info(`library selections: ${librarySelections}`);
            while((match = libraryRegEx.exec(librarySelections)) !== null) {
                core.info(`Selection: ${match[0]}`);
                if (match[0].includes(label)) {
                    core.info(`Match!`);
                    librariesFound.push(label);
                    break;
                }
            }
        });

        return librariesFound;
    }

}