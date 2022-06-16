import { HeaderConfig } from "./HeaderConfig";

/**
 * Configuration type for the issue labeler. Key is the header name e.g. "Library" or "Reproduction Steps"
 * Value is the labeler config that should be applied to the content underneath that header
 */
export type IssueLabelerConfig = Record<string, HeaderConfig>;