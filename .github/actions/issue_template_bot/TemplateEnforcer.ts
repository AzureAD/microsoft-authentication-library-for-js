import * as core from "@actions/core";
import { GithubUtils, IssueBotConfigType } from "./GithubUtils";

export class TemplateEnforcer {
    private action: string;
    private issueNo: number;
    private allTemplates: Array<Map<string, string>>;
    private githubUtils: GithubUtils;

    constructor(issueNo: number, action?: string) {
        this.issueNo = issueNo;
        this.action = action || "edited";
        this.allTemplates = [];
        this.githubUtils = new GithubUtils(issueNo);
    }

    async getTemplate(issueBody: string, templateMap: Map<string, string>, currentLabels: Array<string>): Promise<string|null> {
        let templateName = null
        if (this.action === "opened") {
            templateName = this.matchByLabel(templateMap, currentLabels);
            if (templateName) {
                // To verify the chosen template was at least partially used
                const chosenTemplate = new Map();
                chosenTemplate.set(templateName, templateMap.get(templateName));
                templateName = this.matchBySection(chosenTemplate, issueBody);
            }
        } else {
            templateName = this.matchBySection(templateMap, issueBody);
        }

        if (!templateName) {
            core.info("No matching template found!");
            return null;
        }

        return templateMap.get(templateName) || null;
    }

    async enforceTemplate(issueBody: string, config: IssueBotConfigType) {
        const currentLabels = await this.githubUtils.getCurrentLabels();
        const templateMap = await this.githubUtils.getIssueTemplates();
        const templateUsed = await this.getTemplate(issueBody, templateMap, currentLabels);
        let isIssueFilled = false;
        if (templateUsed) {
            isIssueFilled = this.didIssueFillOutTemplate(issueBody, templateUsed);
        }

        await this.updateIssueLabel(config, currentLabels, !!templateUsed, isIssueFilled);
        await this.commentOnIssue(config, !!templateUsed, isIssueFilled);

        if (config.noTemplateClose) {
            await this.githubUtils.closeIssue();
        }
    }

    async commentOnIssue(config: IssueBotConfigType, isTemplateUsed: boolean, isIssueFilled: boolean) {
        const baseComment = "Invalid Issue Template:"
        if (!config.incompleteTemplateMessage && !config.noTemplateMessage) {
            return;
        }

        const lastCommentId = await this.githubUtils.getLastCommentId(baseComment);

        // Template used and complete, remove previous warning comment
        if (isIssueFilled) {
            if (lastCommentId) {
                core.info("Removing last comment from bot");
                await this.githubUtils.removeComment(lastCommentId);
            }
            return;
        }

        let comment = baseComment + "\n";
        // No Template Used
        if (!isTemplateUsed && config.noTemplateMessage) {
            comment += config.noTemplateMessage;
        } else if (isTemplateUsed && config.incompleteTemplateMessage) {
            // Template used but incomplete
            comment += config.incompleteTemplateMessage;
        } else {
            return;
        }

        if (!lastCommentId) {
            await this.githubUtils.addComment(comment);
            return;
        } else {
            await this.githubUtils.updateComment(lastCommentId, comment);
            return;
        }
    }

    async updateIssueLabel(config: IssueBotConfigType, currentLabels: Array<string>, isTemplateUsed: boolean, isIssueFilled: boolean) {
        if (!config.templateEnforcementLabel) {
            return
        }

        if (!isTemplateUsed) {
            await this.githubUtils.addIssueLabels([config.templateEnforcementLabel]);
            return;
        }

        if (!isIssueFilled) {
            await this.githubUtils.addIssueLabels([config.templateEnforcementLabel]);
            return;
        }

        await this.githubUtils.removeIssueLabels([config.templateEnforcementLabel], currentLabels);
    }

    didIssueFillOutTemplate(issueBody: string, template: string): boolean {
        const templateSections = this.githubUtils.getIssueSections(template);
        const issueSections = this.githubUtils.getIssueSections(issueBody);

        const templateHeaders = [...templateSections.keys()];

        return templateHeaders.every((sectionHeader) => {
            if (!issueSections.has(sectionHeader)) {
                core.info(`Does not have header: ${sectionHeader}`)
                return false;
            }
            let templateContent = templateSections.get(sectionHeader)!.trim();
            let issueContent = issueSections.get(sectionHeader)!.trim();

            if (issueContent === templateContent || templateContent.includes(issueContent)) {
                if (issueContent === templateContent) {
                    core.info(`Content is same as template for section ${sectionHeader}`);
                }
                if (templateContent.includes(issueContent)) {
                    core.info(`Issue Content for ${sectionHeader} is subset of template content`);
                    core.info(`Issue Content: ${issueContent}`);
                    core.info(`Template Content: ${templateContent}`);
                }
                return false;
            }

            return true;
        });
    }

    matchByLabel(templateMap: Map<string, string>, currentLabels: Array<string>): string|null {
        let largestMatch = 0;
        let templateName = null;
        
        templateMap.forEach((contents, filename) => {
            this.allTemplates.push(this.githubUtils.getIssueSections(contents));
            const templateLabels = this.getLabelsFromTemplate(contents);
            const templateMatch = templateLabels.every(templateLabel => {
                return currentLabels.includes(templateLabel);
            });

            if (templateMatch && largestMatch < templateLabels.length) {
                templateName = filename;
                largestMatch = templateLabels.length;
            }
        });

        core.info(`Best Possible Template Match: ${templateName}`);
        return templateName;
    }

    matchBySection(templateMap: Map<string, string>, issueBody: string): string|null {
        let largestFullMatch = 0;
        let largestPartialMatch = 0;
        let fullMatchTemplateName: string|null = null;
        let partialMatchTemplateName: string|null = null;

        const issueSections = this.githubUtils.getIssueSections(issueBody);

        templateMap.forEach((contents, filename) => {
            core.info(`Checking: ${filename}`);
            const templateSections = this.githubUtils.getIssueSections(contents);
            let sectionsMatched = 0;
            let templateHeaders = [...templateSections.keys()];
            templateHeaders.forEach((sectionHeader) => {
                if (issueSections.has(sectionHeader)) {
                    sectionsMatched += 1;
                }
            });

            if (sectionsMatched === templateSections.size && sectionsMatched > largestFullMatch) {
                core.info(`Full Match with ${sectionsMatched} sections!`);
                largestFullMatch = sectionsMatched;
                fullMatchTemplateName = filename;
            } else if (sectionsMatched < templateSections.size && sectionsMatched > largestPartialMatch) {
                core.info(`Partial Match with ${sectionsMatched} sections!`);
                largestPartialMatch = sectionsMatched;
                partialMatchTemplateName = filename;
            }
        });

        if (largestFullMatch >= largestPartialMatch) {
            core.info(`Best Possible Template Match: ${fullMatchTemplateName}`);
            return fullMatchTemplateName;
        } else {
            core.info(`Best Possible Template Match: ${partialMatchTemplateName}`);
            return partialMatchTemplateName;
        }
    }

    getLabelsFromTemplate(templateBody: string): Array<string> {
        const templateMetadataRegEx = RegExp("---.*?labels:\\s*(.*?)(?=\\n).*?---", "gs");
        let match: RegExpExecArray | null;
        const labels = [];
        while((match = templateMetadataRegEx.exec(templateBody)) !== null) {
            labels.push(...match[1].split(" "));
        }

        return labels;
    }
}