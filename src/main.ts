/**
 * Article Summarizer Chrome Extension
 */

/**
* TODOs:
* 1. Make num sentences easily adjustable in the UI
* 4. Show feedback when processing (e.g. a large page just hangs for a while)
* 5. a. Extract TextRank and <html sentence extraction> to their own repo
*    b. Add unit tests for TextRank
* 8. Summarize text selection in an inline overlay window (as we don't want to reload the page in this case)
 TRY TO USE IFRAME for step 8, this will allow me to work from a blank CSS (not share the parent page's)
* 9. Responsive web design: https://developers.google.com/web/fundamentals/design-and-ux/responsive/
* 10. Turn into a FF mobile extension
* 11. Use Web Workers (great for CPU bound tasks and parallelization). Note to use all 4 cores of a CPU you'd have to create 4 workers https://stackoverflow.com/a/11871543/9204336, probably not something I'd do as the document needs to be treated as a whole, but definitely should use at least 1 web worker for performance and not lagging the UI thread. USE transferrable (pass by reference) objects for best performance https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast
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
    const rootDiv = getPageText();
    chrome.runtime.sendMessage({ command: "display_summary", summary: rootDiv }, () => {
        console.log(`Content script sent display_summary command to background, and summarized rootDiv!`);
    });

    // if (SUMMARIZE_ON) {
    //     toggleStylesheets(true);
    //     document.body.innerHTML = ORIGINAL_BODY;

    //     console.log(`Wrote original document body!`);
    //     SUMMARIZE_ON = false;
    // } else {
    //     toggleStylesheets(false);

    //     const rootDiv = getPageText();
    //     document.body.innerHTML = "";
    //     document.body.appendChild(rootDiv);
    //     console.log(`Wrote summarized document body!`);
    //     SUMMARIZE_ON = true;
    // }
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

