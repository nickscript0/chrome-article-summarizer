/**
 * Article Summarizer Chrome Extension
 */

/**
 * TODOs:
 * - Bug: elements that don't have end punctuation are joined with others (See TODO line 11 summarize.ts)
 * - Bug: <a href> els should grab the link text and insert it into the block (instead they're blank)
 * 1. Make num sentences easily adjustable in the UI
 * 4. Show feedback when processing (e.g. a large page just hangs for a while)
 * 5. Add unit tests for things like split sentences edge cases, and TextRank
 * 6. Use an overlay div instead of replacing the body (this will then not repaint and loose image loading when toggling)
 * 7. Add title to summarize page (probably just the <title> value?)

 */

import { getPageText } from "./summarize";

const ORIGINAL_PAGE = document.body.innerHTML;
let SUMMARIZE_ON = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "summarize") {
        toggleSummarizeView();
    }
});

function toggleSummarizeView() {
    if (SUMMARIZE_ON) {
        document.body.innerHTML = ORIGINAL_PAGE;
        console.log(`Wrote original document body!`);
        SUMMARIZE_ON = false;
    } else {
        const rootDiv = getPageText();
        document.body.innerHTML = "";
        document.body.appendChild(rootDiv);
        console.log(`Wrote summarized document body!`);
        SUMMARIZE_ON = true;
    }
}

console.log(`Content Script loaded!`);