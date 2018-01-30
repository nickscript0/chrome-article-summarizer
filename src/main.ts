/**
 * Article Summarizer Chrome Extension
 * - See here why web workers can't be used in content scripts (without a proxy) https://github.com/Rob--W/chrome-api/tree/master/worker_proxy
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
*  - Good post on when to use Structured Clone (worker.postMessage()) and when to use Transferrable objects: https://stackoverflow.com/a/34061491/9204336
*    in short: if JSON use postMessage, if large binary video, audio, or integer array use Transferrable obj
* 12. TODO: Inject Timer into getPageText, that way we can stub it out better
*/

import { getTextBlocksFromDom } from "./summarize";
import { Commands } from './messages';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === Commands.Summarize) {
        sendResponse({ data: {textBlocks: getTextBlocksFromDom(window), title: document.title }});
    }
});

