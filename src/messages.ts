// Interfaces for message passing between tabs and background script

export interface SummaryData {
    title: string;
    sentences: Sentence[];
    textStats: string;
    wordStats: string;
    pageRanks: number[];
    numSummarySentences: number;
}

export interface Sentence {
    content: string;
    rank: string;
}

export enum Commands {
    Display = 'Display',
    ToggleSummarize = 'ToggleSummarize',
    DisplayTabReady = 'DisplayTabReady'
}

export class Timer {
    start: number;
    performance;

    constructor() {
        this.start = this.now();
    }

    logTimeAndReset(m: string) {
        if (this.performanceDefined()) console.log(`${m} ${this.reset().toFixed(0)}ms`);
    }

    reset(): number {
        const now = this.now();
        const measurement = now - this.start;
        this.start = now;
        return measurement;
    }

    now(): number {
        // Trick to run for jsdom uni tests that don't have performance defined
        return this.performanceDefined() ? performance.now() : 0;
    }

    performanceDefined(): boolean {
        return typeof performance !== 'undefined';
    }
}