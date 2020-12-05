import * as core from "@actions/core";
import { IssueBotUtils } from "../utils/IssueBotUtils";
import { IssueBotConfig } from "../types/IssueBotConfig";
import { IssueLabels } from "../utils/github_api_utils/IssueLabels";
import { RepoFiles } from "../utils/github_api_utils/RepoFiles";
import { IssueComments } from "../utils/github_api_utils/IssueComments";
import { StringUtils } from "../utils/StringUtils";

export class TemplateEnforcer {
    private action: string;
    private allTemplates: Array<Map<string, string>>;
    private issueBotUtils: IssueBotUtils;
    private issueLabels: IssueLabels;
    private issueComments: IssueComments;
    private repoFiles: RepoFiles;

    constructor(issueNo: number, action?: string) {
        this.action = action || "edited";
        this.allTemplates = [];
        this.issueBotUtils = new IssueBotUtils(issueNo);
        this.issueLabels = new IssueLabels(this.issueBotUtils);
        this.issueComments = new IssueComments(this.issueBotUtils);
        this.repoFiles = new RepoFiles(this.issueBotUtils);
    }

    /**
     * 
     * @param issueBody 
     * @param config 
     */
    async enforceTemplate(issueBody: string, config: IssueBotConfig): Promise<boolean> {
        const currentLabels = await this.issueLabels.getCurrentLabels();
        const templateMap = await this.repoFiles.getIssueTemplates();
        const templateUsed = await this.getTemplate(issueBody, templateMap, currentLabels);
        let isIssueFilled = false;
        if (templateUsed) {
            isIssueFilled = this.didIssueFillOutTemplate(issueBody, templateUsed, config.optionalSections);
        }

        await this.commentOnIssue(config, !!templateUsed, isIssueFilled);

        if (config.noTemplateClose && !templateUsed) {
            await this.issueBotUtils.closeIssue();
        }

        // Return true if template filled out completely, false if not used or incomplete
        return !!templateUsed && !!isIssueFilled;
    }

    /**
     * 
     * @param issueBody 
     * @param templateMap 
     * @param currentLabels 
     */
    private async getTemplate(issueBody: string, templateMap: Map<string, string>, currentLabels: Array<string>): Promise<string|null> {
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

    /**
     * 
     * @param config 
     * @param isTemplateUsed 
     * @param isIssueFilled 
     */
    private async commentOnIssue(config: IssueBotConfig, isTemplateUsed: boolean, isIssueFilled: boolean) {
        const baseComment = "Invalid Issue Template:"
        if (!config.incompleteTemplateMessage && !config.noTemplateMessage) {
            return;
        }

        const lastCommentId = await this.issueComments.getLastCommentId(baseComment);

        // Template used and complete, remove previous warning comment
        if (isIssueFilled) {
            if (lastCommentId) {
                core.info("Removing last comment from bot");
                await this.issueComments.removeComment(lastCommentId);
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
            await this.issueComments.addComment(comment);
            return;
        } else {
            await this.issueComments.updateComment(lastCommentId, comment);
            return;
        }
    }

    /**
     * 
     * @param issueBody 
     * @param template 
     * @param optionalSections 
     */
    private didIssueFillOutTemplate(issueBody: string, template: string, optionalSections?: Array<string>): boolean {
        const templateSections = StringUtils.getIssueSections(template);
        const issueSections = StringUtils.getIssueSections(issueBody);

        const templateHeaders = [...templateSections.keys()];

        return templateHeaders.every((sectionHeader) => {
            if (optionalSections && optionalSections.includes(sectionHeader)) {
                return true;
            }

            if (!issueSections.has(sectionHeader)) {
                core.info(`Does not have header: ${sectionHeader}`)
                return false;
            }
            const templateContent = StringUtils.normalizeString(templateSections.get(sectionHeader));
            const issueContent = StringUtils.normalizeString(issueSections.get(sectionHeader));
            core.info(`Checking Header: ${sectionHeader}`);

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

    /**
     * 
     * @param templateMap 
     * @param currentLabels 
     */
    matchByLabel(templateMap: Map<string, string>, currentLabels: Array<string>): string|null {
        let largestMatch = 0;
        let templateName = null;
        
        templateMap.forEach((contents, filename) => {
            this.allTemplates.push(StringUtils.getIssueSections(contents));
            const templateLabels = StringUtils.getLabelsFromTemplate(contents);
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

    /**
     * 
     * @param templateMap 
     * @param issueBody 
     */
    matchBySection(templateMap: Map<string, string>, issueBody: string): string|null {
        let largestFullMatch = 0;
        let largestPartialMatch = 0;
        let fullMatchTemplateName: string|null = null;
        let partialMatchTemplateName: string|null = null;

        const issueSections = StringUtils.getIssueSections(issueBody);

        templateMap.forEach((contents, filename) => {
            core.info(`Checking: ${filename}`);
            const templateSections = StringUtils.getIssueSections(contents);
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
}