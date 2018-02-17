/**
 * Article Summarizer Chrome Extension
 * - See here why web workers can't be used in content scripts (without a proxy) https://github.com/Rob--W/chrome-api/tree/master/worker_proxy
 */

/**
* TODOs:
* 1. Make num sentences easily adjustable in the UI
* 3. Fix bug where refreshing the summarized page just shows the css clock (because the summarize event never comes in)
* 5. a. Extract TextRank and <html sentence extraction> to their own repo
*    b. Add unit tests for TextRank
* 6. Handle duplicate subset sentences e.g. https://medium.com/sketchdeck-developer-blog/what-i-wish-i-knew-when-i-became-cto-fdc934b790e3
* 8. Summarize text selection in an inline overlay window (as we don't want to reload the page in this case) - create an iframe "cartoon text" dialog window
* 9. Responsive web design: https://developers.google.com/web/fundamentals/design-and-ux/responsive/
* 10. Turn into a FF mobile extension
* 12. TODO: Concurrency fix: have clients that call shared worker pass their unique ID (pageUrl_clientType), to
* handle the case when 2+ pages are being summarized at once in the browser (this is more robust than just assuming
* what the first 2 connected clients are.
*/

import { getTextBlocksFromDom } from "./summarize";
import { Commands } from './messages';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === Commands.ToggleSummarize) {
        const startTime = Date.now();
        const textBlocks = getTextBlocksFromDom(window);
        sendResponse({
            data: {
                textBlocks: textBlocks,
                title: document.title,
                startTime: startTime,
                url: document.location.href
            }
        });
    }
});

