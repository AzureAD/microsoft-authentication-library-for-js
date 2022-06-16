export class StringUtils {
    /**
     * Returns a list of labels configured on a template
     * @param templateBody 
     */
    static getLabelsFromTemplate(templateBody: Object): Array<string> {
        return templateBody["labels"] || [];
    }

    /**
     * Parses the template and returns an array of required sections on the template
     * @param template
     */
     static getRequiredTemplateSections(template: Object): Array<string> {
        const sections = [];
        const body: Array<Object> = template["body"];
        if (!body) {
            return [];
        }

        body.forEach((item: Object) => {
            if (!item["type"] || item["type"] === "markdown") {
                // Markdown does not show up in the published issue, ignore for the purposes of template matching
                return;
            }

            const validations: Object = item["validations"];
            if (!validations) {
                return;
            }
            const required: boolean = validations["required"];
            if (!required) {
                return;
            }

            const attributes: Object = item["attributes"];
            if (!attributes) {
                return;
            }
            const sectionName = attributes["label"];
            if (sectionName) {
                sections.push(sectionName);
            }
        });

        return sections;
    };

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