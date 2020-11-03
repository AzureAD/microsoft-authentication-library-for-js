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
        let match;

        while ((match = headerRegEx.exec(body)) !== null) {
            core.info(`Found header: ${match[2]}`);
            core.info(`Content: ${match[3]}`);
            this.issueContent.set(match[2], match[3]);
        }
    }

    getLibraries(labelsToSearch: string[]): Array<string> {
        const librariesFound: string[] = [];

        const libraryRegEx = RegExp("-\s*\[\s*[xX]\s*\]\s.*", "g");
        let match: RegExpExecArray | null;

        labelsToSearch.forEach(label => {
            const librarySelections = this.issueContent.get("Library") || "";
            while((match = libraryRegEx.exec(librarySelections)) !== null) {
                if (match[0].includes(label)) {
                    librariesFound.push(label);
                    break;
                }
            }
        });

        return librariesFound;
    }

}