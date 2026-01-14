/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApplicationTelemetry } from "../../config/ClientConfiguration.js";
import { getAndFlushLogsFromCache, Logger } from "../../logger/Logger.js";
import {
    InProgressPerformanceEvent,
    IPerformanceClient,
    PerformanceCallbackFunction,
} from "./IPerformanceClient.js";
import {
    IntFields,
    PerformanceEvent,
    PerformanceEventContext,
    PerformanceEventStackedContext,
    PerformanceEventStatus,
} from "./PerformanceEvent.js";
import { AuthError } from "../../error/AuthError.js";
import { CacheError } from "../../error/CacheError.js";
import { ServerError } from "../../error/ServerError.js";
import { InteractionRequiredAuthError } from "../../error/InteractionRequiredAuthError.js";
import { AccountInfo } from "../../account/AccountInfo.js";

/**
 * Starts context by adding payload to the stack
 * @param event {PerformanceEvent}
 * @param stack {?PerformanceEventStackedContext[]} stack
 */
export function startContext(
    event: PerformanceEvent,
    stack?: PerformanceEventStackedContext[]
): void {
    if (!stack) {
        return;
    }

    stack.push({
        name: event.name,
    });
}

/**
 * Ends context by removing payload from the stack and returning parent or self, if stack is empty, payload
 *
 * @param event {PerformanceEvent}
 * @param stack {?PerformanceEventStackedContext[]} stack
 * @param error {?unknown} error
 */
export function endContext(
    event: PerformanceEvent,
    stack?: PerformanceEventStackedContext[],
    error?: unknown
): PerformanceEventContext | undefined {
    if (!stack?.length) {
        return;
    }

    const peek = (stack: PerformanceEventStackedContext[]) => {
        return stack.length ? stack[stack.length - 1] : undefined;
    };

    const abbrEventName = event.name;
    const top = peek(stack);
    if (top?.name !== abbrEventName) {
        return;
    }

    const current = stack?.pop();
    if (!current) {
        return;
    }

    const errorCode =
        error instanceof AuthError
            ? error.errorCode
            : error instanceof Error
            ? error.name
            : undefined;
    const subErr = error instanceof AuthError ? error.subError : undefined;

    if (errorCode && current.childErr !== errorCode) {
        current.err = errorCode;
        if (subErr) {
            current.subErr = subErr;
        }
    }

    delete current.name;
    delete current.childErr;

    const context: PerformanceEventContext = {
        ...current,
        dur: event.durationMs,
    };

    if (!event.success) {
        context.fail = 1;
    }

    const parent = peek(stack);
    if (!parent) {
        return { [abbrEventName]: context };
    }

    if (errorCode) {
        parent.childErr = errorCode;
    }

    let childName: string;
    if (!parent[abbrEventName]) {
        childName = abbrEventName;
    } else {
        const siblings = Object.keys(parent).filter((key) =>
            key.startsWith(abbrEventName)
        ).length;
        childName = `${abbrEventName}_${siblings + 1}`;
    }
    parent[childName] = context;
    return parent;
}

/**
 * Adds error name and stack trace to the telemetry event
 * @param error {Error}
 * @param logger {Logger}
 * @param event {PerformanceEvent}
 * @param stackMaxSize {number} max error stack size to capture
 */
export function addError(
    error: unknown,
    logger: Logger,
    event: PerformanceEvent,
    stackMaxSize: number = 5
): void {
    if (!(error instanceof Error)) {
        logger.trace(
            "PerformanceClient.addErrorStack: Input error is not instance of Error",
            event.correlationId
        );
        return;
    } else if (error instanceof AuthError) {
        event.errorCode = error.errorCode;
        event.subErrorCode = error.subError;
        if (
            error instanceof ServerError ||
            error instanceof InteractionRequiredAuthError
        ) {
            event.serverErrorNo = error.errorNo;
        }
        return;
    } else if (error instanceof CacheError) {
        event.errorCode = error.errorCode;
        return;
    } else if (event.errorStack?.length) {
        logger.trace(
            "PerformanceClient.addErrorStack: Stack already exist",
            event.correlationId
        );
        return;
    } else if (!error.stack?.length) {
        logger.trace(
            "PerformanceClient.addErrorStack: Input stack is empty",
            event.correlationId
        );
        return;
    }

    if (error.stack) {
        event.errorStack = compactStack(error.stack, stackMaxSize);
    }
    event.errorName = error.name;
}

/**
 * Compacts error stack into array by fetching N first entries
 * @param stack {string} error stack
 * @param stackMaxSize {number} max error stack size to capture
 * @returns {string[]}
 */
export function compactStack(stack: string, stackMaxSize: number): string[] {
    if (stackMaxSize < 0) {
        return [];
    }

    const stackArr = stack.split("\n") || [];

    const res: string[] = [];

    // Check for a handful of known, common runtime errors and log them (with redaction where applicable).
    const firstLine = stackArr[0];
    if (
        firstLine.startsWith("TypeError: Cannot read property") ||
        firstLine.startsWith("TypeError: Cannot read properties of") ||
        firstLine.startsWith("TypeError: Cannot set property") ||
        firstLine.startsWith("TypeError: Cannot set properties of") ||
        firstLine.endsWith("is not a function")
    ) {
        // These types of errors are not at risk of leaking PII. They will indicate unavailable APIs
        res.push(compactStackLine(firstLine));
    } else if (
        firstLine.startsWith("SyntaxError") ||
        firstLine.startsWith("TypeError")
    ) {
        // Prevent unintentional leaking of arbitrary info by redacting contents between both single and double quotes
        res.push(
            compactStackLine(
                // Example: SyntaxError: Unexpected token 'e', "test" is not valid JSON -> SyntaxError: Unexpected token <redacted>, <redacted> is not valid JSON
                firstLine.replace(/['].*[']|["].*["]/g, "<redacted>")
            )
        );
    }

    // Get top N stack lines
    for (let ix = 1; ix < stackArr.length; ix++) {
        if (res.length >= stackMaxSize) {
            break;
        }
        const line = stackArr[ix];
        res.push(compactStackLine(line));
    }
    return res;
}

/**
 * Compacts error stack line by shortening file path
 * Example: https://localhost/msal-common/src/authority/Authority.js:100:1 -> Authority.js:100:1
 * @param line {string} stack line
 * @returns {string}
 */
export function compactStackLine(line: string): string {
    const filePathIx = line.lastIndexOf(" ") + 1;
    if (filePathIx < 1) {
        return line;
    }
    const filePath = line.substring(filePathIx);

    let fileNameIx = filePath.lastIndexOf("/");
    fileNameIx = fileNameIx < 0 ? filePath.lastIndexOf("\\") : fileNameIx;

    if (fileNameIx >= 0) {
        return (
            line.substring(0, filePathIx) +
            "(" +
            filePath.substring(fileNameIx + 1) +
            (filePath.charAt(filePath.length - 1) === ")" ? "" : ")")
        ).trimStart();
    }

    return line.trimStart();
}

export function getAccountType(
    account?: AccountInfo
): "AAD" | "MSA" | "B2C" | undefined {
    const idTokenClaims = account?.idTokenClaims;
    if (idTokenClaims?.tfp || idTokenClaims?.acr) {
        return "B2C";
    }

    if (!idTokenClaims?.tid) {
        return undefined;
    } else if (idTokenClaims?.tid === "9188040d-6c67-4c5b-b112-36a304b66dad") {
        return "MSA";
    }
    return "AAD";
}

export abstract class PerformanceClient implements IPerformanceClient {
    protected authority: string;
    protected libraryName: string;
    protected libraryVersion: string;
    protected applicationTelemetry: ApplicationTelemetry;
    protected clientId: string;
    protected logger: Logger;
    protected callbacks: Map<string, PerformanceCallbackFunction>;

    protected eventsByCorrelationId: Map<string, PerformanceEvent>;
    protected eventStack: Map<string, PerformanceEventStackedContext[]>;
    protected intFields: Set<string>;

    /**
     * Accumulate dynamically-created numeric attributes per correlationId
     * e.g. AcquireTokenSilentDurationMs, AcquireTokenRedirectCallCount, etc.
     */
    protected dynamicAttributesByCorrelationId: Map<string, Record<string, number>>;

    /**
     * Tracks the set of "known" keys for the given correlationId. This is derived
     * from the baseline event created in startMeasurement (Object.keys of that event),
     * plus the keys the library itself sets later (e.g., durationMs, context, logs, etc.).
     */
    protected knownEventKeysByCorrelationId: Map<string, Set<string>>;

    constructor(
        clientId: string,
        authority: string,
        logger: Logger,
        libraryName: string,
        libraryVersion: string,
        applicationTelemetry: ApplicationTelemetry,
        intFields?: Set<string>
    ) {
        this.authority = authority;
        this.libraryName = libraryName;
        this.libraryVersion = libraryVersion;
        this.applicationTelemetry = applicationTelemetry;
        this.clientId = clientId;
        this.logger = logger;
        this.callbacks = new Map();

        this.eventsByCorrelationId = new Map();
        this.eventStack = new Map();
        this.dynamicAttributesByCorrelationId = new Map();
        this.knownEventKeysByCorrelationId = new Map();

        this.intFields = intFields || new Set();
        for (const item of IntFields) {
            this.intFields.add(item);
        }
    }

    /** Generates and returns a unique id, typically a guid. */
    abstract generateId(): string;

    /**
     * Starts measuring performance for a given operation.
     * Returns a function that should be used to end the measurement.
     */
    startMeasurement(
        measureName: string,
        correlationId?: string
    ): InProgressPerformanceEvent {
        // Generate a placeholder correlation if the request does not provide one
        const eventCorrelationId = correlationId || this.generateId();

        const inProgressEvent: PerformanceEvent = {
            eventId: this.generateId(),
            status: PerformanceEventStatus.InProgress,
            authority: this.authority,
            libraryName: this.libraryName,
            libraryVersion: this.libraryVersion,
            clientId: this.clientId,
            name: measureName,
            startTimeMs: Date.now(),
            correlationId: eventCorrelationId,
            appName: this.applicationTelemetry?.appName,
            appVersion: this.applicationTelemetry?.appVersion,
        };

        // Store in progress events so they can be discarded if not ended properly
        this.cacheEventByCorrelationId(inProgressEvent);

        // Derive the per-correlation baseline known keys
        this.seedKnownKeysFromBaseline(eventCorrelationId, inProgressEvent);

        startContext(inProgressEvent, this.eventStack.get(eventCorrelationId));

        // Return the event and functions the caller can use to properly end/flush the measurement
        return {
            end: (
                event?: Partial<PerformanceEvent>,
                error?: unknown,
                account?: AccountInfo
            ): PerformanceEvent | null => {
                return this.endMeasurement(
                    {
                        // Initial set of event properties
                        ...inProgressEvent,
                        // Properties set when event ends
                        ...event,
                    },
                    error,
                    account
                );
            },
            discard: () => {
                return this.discardMeasurements(inProgressEvent.correlationId);
            },
            add: (fields: { [key: string]: {} | undefined }) => {
                return this.addFields(fields, inProgressEvent.correlationId);
            },
            increment: (fields: { [key: string]: number | undefined }) => {
                return this.incrementFields(
                    fields,
                    inProgressEvent.correlationId
                );
            },
            event: inProgressEvent,
        };
    }

    /**
     * Stops measuring the performance for an operation. Should only be called directly by PerformanceClient classes,
     * as consumers should instead use the function returned by startMeasurement.
     * Adds a new field named as "[event name]DurationMs" for sub-measurements, completes and emits an event
     * otherwise.
     * Adds sub-measure durations as dynamicAttributes; completes and emits the root event.
     *
     * @param {PerformanceEvent} event
     * @param {unknown} error
     * @param {AccountInfo?} account
     * @returns {(PerformanceEvent | null)}
     */
    endMeasurement(
        event: PerformanceEvent,
        error?: unknown,
        account?: AccountInfo
    ): PerformanceEvent | null {
        const rootEvent: PerformanceEvent | undefined =
            this.eventsByCorrelationId.get(event.correlationId);
        if (!rootEvent) {
            this.logger.trace(
                `PerformanceClient: Measurement not found for '${event.eventId}'`,
                event.correlationId
            );
            return null;
        }

        const isRoot = event.eventId === rootEvent.eventId;

        event.durationMs = Math.round(
            event.durationMs || this.getDurationMs(event.startTimeMs)
        );

        const context = JSON.stringify(
            endContext(
                event,
                this.eventStack.get(rootEvent.correlationId),
                error
            )
        );

        if (error) {
            addError(error, this.logger, rootEvent);
        }

        // Sub-measurements: mirror their duration to dynamicAttributes only (do NOT keep at root)
        if (!isRoot) {
            rootEvent.incompleteSubMeasurements?.delete(event.eventId);
            const dynKey = event.name + "DurationMs";
            const dynVal = Math.floor(event.durationMs!);
            this.setDynamicAttributes(rootEvent.correlationId, dynKey, dynVal);
            return { ...rootEvent }; // continuity; root remains clean
        }

        if (
            isRoot &&
            !error &&
            (rootEvent.errorCode || rootEvent.subErrorCode)
        ) {
            this.logger.trace(
                `PerformanceClient: Remove error and sub-error codes for root event '${event.name}' as intermediate error was successfully handled`,
                event.correlationId
            );
            rootEvent.errorCode = undefined;
            rootEvent.subErrorCode = undefined;
        }

        let finalEvent: PerformanceEvent = { ...rootEvent, ...event };
        let incompleteSubsCount: number = 0;
        // Incomplete sub-measurements are discarded. They are likely an instrumentation bug that should be fixed.
        finalEvent.incompleteSubMeasurements?.forEach((subMeasurement) => {
            this.logger.trace(
                `PerformanceClient: Incomplete submeasurement '${subMeasurement.name}' found for '${event.name}'`,
                finalEvent.correlationId
            );
            incompleteSubsCount++;
        });
        finalEvent.incompleteSubMeasurements = undefined;

        const logs = getAndFlushLogsFromCache(event.correlationId);
        // Format logs: [millis1,hash1;millis2,hash2;...]
        const formattedLogs = logs
            .map(
                (logMessage) => `${logMessage.milliseconds},${logMessage.hash}`
            )
            .join(";");

        finalEvent = {
            ...finalEvent,
            status: PerformanceEventStatus.Completed,
            incompleteSubsCount,
            context,
            logs: formattedLogs,
        };
        if (account) {
            finalEvent.accountType = getAccountType(account);
            finalEvent.dataBoundary = account.dataBoundary;
        }

        // Mark library-managed adds as "known" for this correlation (so they won't be hoisted)
        this.ensureKnownKeys(finalEvent.correlationId, [
            "durationMs",
            "success",
            "context",
            "logs",
            "errorCode",
            "subErrorCode",
            "serverErrorNo",
            "accountType",
            "dataBoundary",
            "incompleteSubsCount",
        ]);

        // Truncate known integral fields
        this.truncateIntegralFields(finalEvent);

        // Hoist any unknown numeric keys into dynamicAttributes
        this.hoistUnknownNumericToDynamic(finalEvent);

        // Serialize dynamicAttributes if non-empty
        const dynamicAttrs = this.dynamicAttributesByCorrelationId.get(finalEvent.correlationId);
        if (dynamicAttrs && Object.keys(dynamicAttrs).length) {
            finalEvent.dynamicAttributes = JSON.stringify(dynamicAttrs);
        }

        this.emitEvents([finalEvent], event.correlationId);
        this.discardMeasurements(rootEvent.correlationId);
        return finalEvent;
    }

    /**
     * Saves extra information to be emitted when the measurements are flushed.
     * Unknown numeric keys are mirrored into dynamicAttributes and NOT kept at root.
     */
    addFields(
        fields: { [key: string]: {} | undefined },
        correlationId: string
    ): void {
        const event = this.eventsByCorrelationId.get(correlationId);
        if (!event) {
            this.logger.trace("PerformanceClient: Event not found for", correlationId);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated: any = { ...event };
        const known = this.knownEventKeysByCorrelationId.get(correlationId) || new Set<string>();

        for (const [key, value] of Object.entries(fields)) {
            if (known.has(key)) {
                updated[key] = value;
                continue;
            }

            if (typeof value === "number" && !isNaN(Number(value))) {
                this.setDynamicAttributes(correlationId, key, Math.floor(Number(value)));
                // Do not keep unknown numeric on root
                continue;
            }

            // Unknown non-numeric: keep root entry if you want (or drop to keep schema tight).
            // Here we keep it to avoid silently losing data; if you want stricter behavior, delete instead.
            updated[key] = value;
        }

        this.eventsByCorrelationId.set(correlationId, updated);
    }

    /**
     * Increments counters. Mirrors to dynamicAttributes; does not retain counters at root in final emit.
     */
    incrementFields(
        fields: { [key: string]: number | undefined },
        correlationId: string
    ): void {
        const event = this.eventsByCorrelationId.get(correlationId);
        if (!event) {
            this.logger.trace("PerformanceClient: Event not found for", correlationId);
            return;
        }

        for (const counter in fields) {
            if (!Object.prototype.hasOwnProperty.call(event, counter)) {
                // Keep a transient counter at root for continuity only while measuring
                // (It will be hoisted/removed by hoistUnknownNumericToDynamic at emit time)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (event as any)[counter] = 0;
            } else if (isNaN(Number((event as any)[counter]))) {
                // non-numeric roots cannot be incremented
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (event as any)[counter] += fields[counter] ?? 0;

            this.setDynamicAttributes(
                correlationId,
                counter,
                Math.floor(Number((event as any)[counter]))
            );
        }

        this.eventsByCorrelationId.set(correlationId, { ...event });
    }

    /**
     * Upserts event into event cache; seeds per-correlation structures.
     */
    protected cacheEventByCorrelationId(event: PerformanceEvent): void {
        const rootEvent = this.eventsByCorrelationId.get(event.correlationId);
        if (rootEvent) {
            rootEvent.incompleteSubMeasurements =
                rootEvent.incompleteSubMeasurements || new Map();
            rootEvent.incompleteSubMeasurements.set(event.eventId, {
                name: event.name,
                startTimeMs: event.startTimeMs,
            });
        } else {
            this.eventsByCorrelationId.set(event.correlationId, { ...event });
            this.eventStack.set(event.correlationId, []);
            this.dynamicAttributesByCorrelationId.set(event.correlationId, {});
            this.knownEventKeysByCorrelationId.set(event.correlationId, new Set<string>());
        }
    }

    /**
     * Removes measurements and aux data for a given correlation id.
     */
    discardMeasurements(correlationId: string): void {
        this.eventsByCorrelationId.delete(correlationId);
        this.eventStack.delete(correlationId);
        this.dynamicAttributesByCorrelationId.delete(correlationId);
        this.knownEventKeysByCorrelationId.delete(correlationId);
    }

    /**
     * Registers/unregisters performance callbacks.
     */
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        for (const [id, cb] of this.callbacks) {
            if (cb.toString() === callback.toString()) {
                this.logger.warning(
                    `PerformanceClient: Performance callback is already registered with id: ${id}`,
                    ""
                );
                return id;
            }
        }

        const callbackId = this.generateId();
        this.callbacks.set(callbackId, callback);
        this.logger.verbose(
            `PerformanceClient: Performance callback registered with id: '${callbackId}'`,
            ""
        );
        return callbackId;
    }

    removePerformanceCallback(callbackId: string): boolean {
        const result = this.callbacks.delete(callbackId);
        this.logger.verbose(
            `PerformanceClient: Performance callback '${callbackId}' ${result ? "removed" : "not removed"}.`,
            ""
        );
        return result;
    }

    emitEvents(events: PerformanceEvent[], correlationId: string): void {
        this.logger.verbose("PerformanceClient: Emitting performance events", correlationId);
        this.callbacks.forEach((cb, id) => {
            this.logger.trace(
                `PerformanceClient: Emitting event to callback '${id}'`,
                correlationId
            );
            cb.apply(null, [events]);
        });
    }

    /**
     * Truncate known integral fields in performance event.
     */
    private truncateIntegralFields(event: PerformanceEvent): void {
        this.intFields.forEach((key) => {
            if (key in event && typeof (event as any)[key] === "number") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (event as any)[key] = Math.floor((event as any)[key]);
            }
        });
    }

    /**
     * Move unknown numeric properties into dynamicAttributes and remove them from root.
     */
    private hoistUnknownNumericToDynamic(finalEvent: PerformanceEvent): void {
        const cid = finalEvent.correlationId;
        const known = this.knownEventKeysByCorrelationId.get(cid) || new Set<string>();
        const bucket = this.dynamicAttributesByCorrelationId.get(cid);
        if (!bucket) return;

        for (const [key, value] of Object.entries(finalEvent)) {
            if (known.has(key)) continue;

            if (typeof value === "number" && !isNaN(Number(value))) {
                this.setDynamicAttributes(cid, key, Math.floor(Number(value)));
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                delete (finalEvent as any)[key];
            }
        }
    }

    /**
     * Ensure certain keys are marked as "known" for a given correlation id.
     */
    private ensureKnownKeys(correlationId: string, keys: string[]): void {
        const known = this.knownEventKeysByCorrelationId.get(correlationId);
        if (!known) return;
        for (const k of keys) known.add(k);
    }

    /**
     * Seed the "known keys" set for a correlation from the baseline event created in startMeasurement,
     * and include the keys that the library will add later.
     */
    private seedKnownKeysFromBaseline(correlationId: string, baseline: PerformanceEvent): void {
        const known = this.knownEventKeysByCorrelationId.get(correlationId);
        if (!known) return;

        // Baseline known keys from the event we just constructed
        Object.keys(baseline).forEach((k) => known.add(k));

        // Add library-managed keys that we know will be set later
        [
            "durationMs",
            "success",
            "context",
            "logs",
            "errorCode",
            "subErrorCode",
            "serverErrorNo",
            "accountType",
            "dataBoundary",
            "incompleteSubMeasurements",
            "incompleteSubsCount",
            "dynamicAttributes",
        ].forEach((k) => known.add(k));
    }

    /**
     * Set a dynamicAttributes attribute (numeric only).
     */
    private setDynamicAttributes(
        correlationId: string,
        key: string,
        value: number | undefined
    ): void {
        if (value === undefined || value === null || isNaN(Number(value))) return;
        const bucket = this.dynamicAttributesByCorrelationId.get(correlationId);
        if (!bucket) return;
        bucket[key] = Math.floor(Number(value));
    }

    /**
     * Returns event duration in milliseconds (non-negative).
     */
    private getDurationMs(startTimeMs: number): number {
        const durationMs = Date.now() - startTimeMs;
        // Handle clock skew (never return negative)
        return durationMs < 0 ? 0 : durationMs;
    }
}
