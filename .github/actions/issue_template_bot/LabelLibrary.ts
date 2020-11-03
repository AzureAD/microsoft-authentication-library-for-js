import * as core from "@actions/core";

export function LabelLibrary(issueNo: number, body: string) {
    const headerRegEx = RegExp("(##\s*(.*))", "g");

    let match;

    while ((match = headerRegEx.exec(body)) !== null) {
        core.info(`Found match: ${match}`);
    }
}