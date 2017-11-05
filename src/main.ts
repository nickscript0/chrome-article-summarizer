/**
 * Article Summarizer Chrome Extension
 */

/**
 * TODOs:
 * 1. Make num sentences easily adjustable in the UI
 * 4. Show feedback when processing (e.g. a large page just hangs for a while)
 * 5. a. Extract TextRank and <html sentence extraction> to their own repo
 *    b. Add unit tests for TextRank
 * 6. Use an overlay div instead of replacing the body (this will then not repaint and lose image loading when toggling)
 * 7. Add title to summarize page (probably just the <title> value?)
 * 8. Extract people using NLP and list top 5 most referenced
 * 9. Extract places using NLP and list top 5 most referenced
 * 10. Extract nouns using NLP and list top 5 most referenced
 * 11. Replace the stylesheet with our own, as sometimes original page styles will bleed through
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