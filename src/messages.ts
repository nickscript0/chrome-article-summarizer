// Interfaces for message passing between tabs and background script

export interface SummaryData {
    title: string;
    sentences: string[];
    textStats: string;
    wordStats: string;
    pageRanks: number[];
    numSummarySentences: number;
}