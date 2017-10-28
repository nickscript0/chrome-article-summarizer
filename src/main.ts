/**
 * Article Summarizer Chrome Extension
 */

import { getPageText } from "summarize";

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