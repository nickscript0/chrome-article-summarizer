// Interfaces for message passing between tabs and background script

export interface SimpleCommand {
    command: Commands;
}

export interface AssignIdCommand {
    command: Commands.AssignId;
    id: string;
}

export interface WorkerPayloadCommand {
    command: Commands.Display;
    payload: WorkerPayload;
}

export interface InputPayloadCommand {
    command: Commands.ToggleSummarize;
    payload: InputPayload;
}


// export interface WorkerCommand {
//     type: Commands;
//     url: string;
//     client: WorkerClients;
//     payload?: InputPayload;
// }

// export enum WorkerClients {
//     BackgroundPage,
//     DisplayPage
// }

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

export interface SummaryData {
    title: string;
    sentences: Sentence[];
    textStats: string;
    wordStats: string;
    pageRanks: number[];
    numSummarySentences: number;
    timing: Timings;
}

export interface Sentence {
    content: string;
    rank: string;
}

export enum Commands {
    Display = 'Display',
    ToggleSummarize = 'ToggleSummarize',
    DisplayTabReady = 'DisplayTabReady',
    AssignId = 'AssignId'
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