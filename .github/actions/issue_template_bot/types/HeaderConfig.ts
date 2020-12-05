import { LabelConfig } from "./LabelConfig";

export type HeaderConfig = {
    labels: Record<string, LabelConfig>,
    enforceSelection?: boolean,
    message?: string
}