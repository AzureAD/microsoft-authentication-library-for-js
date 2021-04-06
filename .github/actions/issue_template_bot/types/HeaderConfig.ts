import { LabelConfig } from "./LabelConfig";

/**
 * Configuration for the content underneath a header. 
 */
export type HeaderConfig = {
    labels: Record<string, LabelConfig>
}