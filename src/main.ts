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
 */

import { getPageText } from "./summarize";

const ORIGINAL_BODY = document.body.innerHTML;
let SUMMARIZE_ON = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "summarize") {
        toggleSummarizeView();
    }
});

function toggleSummarizeView() {
    if (SUMMARIZE_ON) {
        toggleStylesheets(true);
        document.body.innerHTML = ORIGINAL_BODY;

        console.log(`Wrote original document body!`);
        SUMMARIZE_ON = false;
    } else {
        toggleStylesheets(false);

        const rootDiv = getPageText();
        document.body.innerHTML = "";
        document.body.appendChild(rootDiv);
        console.log(`Wrote summarized document body!`);
        SUMMARIZE_ON = true;
    }
}

function toggleStylesheets(enabled: boolean) {
    for (let i = 0; i < document.styleSheets.length; i++) {
        // TODO: find a more consistent way to handle this
        // ChartJS's stylesheet is added on module import so exists in the head before even calling getPage
        const ss = <CSSStyleSheet>document.styleSheets[i];
        const isChartJs = ss.cssRules && ss.cssRules[0] && ss.cssRules[0].cssText && ss.cssRules[0].cssText.includes('chartjs');
        if (!isChartJs) document.styleSheets[i].disabled = !enabled;
    }


}

console.log(`Content Script loaded!`);