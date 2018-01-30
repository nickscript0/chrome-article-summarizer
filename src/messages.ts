// Interfaces for message passing between tabs and background script

export interface SummaryData {
    title: string;
    sentences: string[];
    textStats: string;
    wordStats: string;
    pageRanks: number[];
    numSummarySentences: number;
}

export enum Commands {
    Display = 'Display',
    Summarize = 'Summarize',
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