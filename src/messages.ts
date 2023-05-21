// Interfaces for message passing between tabs and background script

export enum Commands {
    Display = 'Display',
    ToggleSummarize = 'ToggleSummarize',
    DisplayTabReady = 'DisplayTabReady',
    AssignId = 'AssignId',
    PopupKillStickies = 'popup-kill-sticky-headers',
    PopupToggleSummarize = 'popup-toggle-summarize',
    PopupAddRelativeDates = 'popup-add-relative-dates'
}

// This must match the strings defined in manifest.json "commands" section
export enum KeyboardCommands {
    ToggleSummarize = 'toggle-page-summary',
    TriggerKillStickies = 'trigger-kill-sticky',
    TriggerAddRelativeDates = 'add-relative-dates'
}

export enum ContextCommands {
    ToggleSummarize = 'context-toggle-page-summary',
    TriggerKillStickies = 'context-trigger-kill-sticky'
}

export enum PortName {
    popup = 'popup-port'
}

export interface WorkerPayloadCommand {
    command: Commands.Display;
    payload: WorkerPayload;
}

export interface InputPayloadCommand {
    command: Commands.ToggleSummarize;
    payload: InputPayload;
}

export interface InputPayload {
    textBlocks: string[];
    title: string;
    startTime: number;
    url: string;
    timings: Timings;
}

export interface WorkerPayload {
    type: Commands;
    payload: SummaryData;
    startTime: number;
    url: string;
}

export interface GptPrice {
    totalPriceDollars: number;
    percentOfTokenLimit: string;
    requestsUntilTenDollars: string;
    requestsUntilOneDollar: string;
    modelName: string;
}
export interface GptPrices {
    gpt35turbo: GptPrice;
    gpt4_8kContext: GptPrice;
    gpt4_32kContext: GptPrice;
}

export interface GptStats {
    numberOfWords: number;
    numberOfCharacters: number;
    numTokens: number;
    prices?: {
        gpt35turbo: GptPrice;
        gpt4_8kContext: GptPrice;
        gpt4_32kContext: GptPrice;
    };
}

export interface SummaryData {
    title: string;
    sentences: Sentence[];
    textStats: string;
    wordStats: string;
    pageRanks: number[];
    numSummarySentences: number;
    timing: Timings;
    nlpTiming: Timings;
    gptStats: GptStats;
}

export interface Sentence {
    content: string;
    rank: number;
}

export type Timings = Array<Timing>;

interface Timing {
    name: string;
    value: number;
}

export class Timer {
    start: number;
    performance;
    data: Timings;

    constructor() {
        this.start = this.now();
        this.data = [];
    }

    logTimeAndReset(m: string) {
        if (this.performanceDefined()) {
            const timeDiff = this.reset();
            this.data.push({ name: m, value: Math.round(timeDiff) });
            console.log(`${m} ${timeDiff.toFixed(0)}ms`);
        }
    }

    serialize(): Timings {
        return this.data;
    }

    private reset(): number {
        const now = this.now();
        const measurement = now - this.start;
        this.start = now;
        return measurement;
    }

    private now(): number {
        // Trick to run for jsdom uni tests that don't have performance defined
        return this.performanceDefined() ? performance.now() : 0;
    }

    private performanceDefined(): boolean {
        return typeof performance !== 'undefined';
    }
}

export function queryTabs(
    queryInfo: chrome.tabs.QueryInfo
): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, _reject) => {
        chrome.tabs.query(queryInfo, function(tabs) {
            resolve(tabs[0]);
        });
    });
}

export function queryCurrentTab() {
    return queryTabs({ active: true, currentWindow: true, highlighted: true });
}
