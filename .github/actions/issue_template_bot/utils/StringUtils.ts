import * as yaml from "js-yaml";

export class StringUtils {
    /**
     * Returns a list of labels configured on a template
     * @param templateBody 
     */
    static getLabelsFromTemplate(templateBody: string): Array<string> {
        const templateMetadata: Object = yaml.load(templateBody);
        const labels = templateMetadata["labels"] || "";

        return labels.split(" ");
    }

    /**
     * Parses the body of an issue and returns a map where the key is the heading (denoted by at least 2 #) and value is the content underneath
     * @param issueBody 
     */
    static getIssueSections(issueBody: string): Map<string, string> {
        const headerRegEx = RegExp("(##+\\s*(.*?\\n))(.*?)(?=##+|$)", "gs");
        let match: RegExpExecArray | null;
        const issueContent = new Map();

        while ((match = headerRegEx.exec(issueBody)) !== null) {
            issueContent.set(match[2].trim(), match[3]);
        }

        return issueContent;
    };

    static normalizeString(rawString?: string): string {
        if (!rawString) {
            return "";
        }

        // Replace newlines and multiple whitespace characters with a single whitespace character
        return rawString.replace(/\s*[\n\r]+\s*/g, " ").trim();
    }
}