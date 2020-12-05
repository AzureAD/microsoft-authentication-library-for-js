import { IssueLabelerConfig } from "./IssueLabelerConfig";

export type IssueBotConfig = {
    selectors: IssueLabelerConfig,
    enforceTemplate: boolean,
    optionalSections?: Array<string>,
    templateEnforcementLabel?: string,
    incompleteTemplateMessage?: string,
    noTemplateMessage?: string,
    noTemplateClose?: boolean
};