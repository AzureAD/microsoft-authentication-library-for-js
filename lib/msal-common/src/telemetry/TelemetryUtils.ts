import { EVENT_NAME_PREFIX } from "./TelemetryConstants";

export const prependEventNamePrefix = (suffix: string): string => `${EVENT_NAME_PREFIX}${suffix || ""}`;

export const supportsBrowserPerformance = (): boolean => !!(
    typeof window !== "undefined" &&
        "performance" in window &&
        window.performance.mark && 
        window.performance.measure
);

export const endBrowserPerformanceMeasurement = (measureName: string, startMark: string, endMark: string) => {
    if (supportsBrowserPerformance()) {
        window.performance.mark(endMark);
        window.performance.measure(measureName, startMark, endMark);

        window.performance.clearMeasures(measureName);
        window.performance.clearMarks(startMark);
        window.performance.clearMarks(endMark);
    }
};

export const startBrowserPerformanceMeasurement = (startMark: string) => {
    if (supportsBrowserPerformance()) {
        window.performance.mark(startMark);
    }
};
