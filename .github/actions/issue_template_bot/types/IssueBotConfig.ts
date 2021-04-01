import { IssueLabelerConfig } from "./IssueLabelerConfig";

/**
 * Main upper level configuration for the issue bot
 */
export type IssueBotConfig = {
    selectors: IssueLabelerConfig,
    enforceTemplate: boolean,
    templateEnforcementLabel?: string,
    incompleteTemplateMessage?: string,
    noTemplateMessage?: string,
    noTemplateClose?: boolean
};