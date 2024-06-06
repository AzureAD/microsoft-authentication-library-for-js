import { ProjectConfig } from "./ProjectConfig";

/**
 * Configuration options related to labeling an issue based on issue content that can be set in issue_template_bot.json
 */
export type LabelConfig = {
    searchStrings: Array<string>,
    assignees?: Array<string>,
    project?: ProjectConfig
}