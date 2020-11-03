import * as core from "@actions/core";

export function LabelLibrary(issueNo: number, body: string) {
    const headerRegEx = RegExp("(##\s*(.*?\n))(.*?)(?=##|$)", "gs");

    let match;
    const issueContent = new Map(); // Key is the Header, value is content under header

    while ((match = headerRegEx.exec(body)) !== null) {
        core.info(`Found header: ${match[2]}`);
        core.info(`Content: ${match[3]}`);
        issueContent.set(match[2], match[3]);
    }

    core.info("FINAL DICT");
    core.info(issueContent.toString());
}