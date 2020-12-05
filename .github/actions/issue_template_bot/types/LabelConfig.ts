import { ProjectConfig } from "./ProjectConfig";

export type LabelConfig = {
    searchStrings: Array<string>,
    assignees?: Array<string>,
    project?: ProjectConfig
}