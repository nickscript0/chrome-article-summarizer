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
    Summarize = 'Summarize'
}

export class Timer {
    start: number;
    currentWindow;

    constructor(currentWindow = window) {
        this.currentWindow = currentWindow;
        this.start = this.currentWindow.performance.now();
    }

    logTimeAndReset(m: string) {
        console.log(`${m} ${this.reset().toFixed(0)}ms`);
    }

    reset(): number {
        const now = this.currentWindow.performance.now();
        const measurement = now - this.start;
        this.start = now;
        return measurement;
    }
}