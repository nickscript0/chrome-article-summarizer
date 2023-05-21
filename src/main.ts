/**
 * Article Summarizer Chrome Extension
 * - See here why web workers can't be used in content scripts (without a proxy) https://github.com/Rob--W/chrome-api/tree/master/worker_proxy
 */

/**
* TODOs:
* BUG: Firefox only with packed xpi extension error: everything works except Desktop Firefox only popup links are broken with
  TypeError: Argument 1 of StructuredCloneHolder.deserialize is not an object.
  Reading online: seems could be related to the popup tab being closed

* BUGS: 
*  1. this page is too large and crashes the extension after a while https://www.gnu.org/software/make/manual/make.html
*  2. Firefox reader view, summarize doesn't work (extension is trigerred but seems to be updating wrong tabId?)
* 0. DO THIS NEXT:
   - Add previously defined feature:
     - if keyboard initiated show it in the RHS margin
     - if mobile initiated (select text, buttons list), show it inline
   - In summarized view, add button to reveal entire article with textranked sentences in bold!
   - Also in the reveal entire article view consider shading sentences darkness of grey based on their rank
   - To do this really right, would need to preserve paragraph structure which is probably much more difficult as I currently don't detect paragraphs just sentences. Could be as easy as detecting <p> elements
* 1. Add toggle for displaying ranked sentences ordered by occurrence or by rank
* 1. Create nice large buttons for mobile popup menu instead of hyperlinks
* 1. Improve fonts
* 2. Allow seeing the context of a sentence (maybe on left-click it shows more and more sentences before and after, and right click hides them again)
    a. A possible better/simpler solution is to add a RANK SIDEBAR to the original page and clicking on each moves the page to the ranked and COLORED sentence in the original
* 5. a. Extract TextRank and <html sentence extraction> to their own repo
*    b. Add unit tests for TextRank
* 6. Handle duplicate subset sentences e.g. https://medium.com/sketchdeck-developer-blog/what-i-wish-i-knew-when-i-became-cto-fdc934b790e3
* 8. Summarize text selection in an inline overlay window (as we don't want to reload the page in this case) - create an iframe "cartoon text" dialog window
* 11. Consider using document.querySelectorAll("body *") etc.. instead of treeWalker, is this more efficient??
*/

import { getReadabilityFromDom, getTextBlocksFromDom } from './summarize';
import { Commands, InputPayload, Timer } from './messages';
import { killStickyHeaders } from './kill-sticky-headers';
import { addRelativeDatesToDocument } from './add-relative-dates';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`maint.ts COMMAND IS`, request.command);
    if (request.command === Commands.ToggleSummarize) {
        const startTime = Date.now();
        const t = new Timer();
        const textBlocks = getTextBlocksFromDom(window);
        t.logTimeAndReset('text from dom');
        const readabilityText = getReadabilityFromDom(window) || '';
        t.logTimeAndReset('mozilla readability text from dom');

        const payload: InputPayload = {
            textBlocks: textBlocks,
            readabilityText,
            title: document.title,
            startTime: startTime,
            url: document.location ? document.location.href : '',
            timings: t.serialize()
        };

        sendResponse({
            data: payload
        });
    } else if (request.command === Commands.PopupKillStickies) {
        killStickyHeaders();
    } else if (request.command === Commands.PopupAddRelativeDates) {
        addRelativeDatesToDocument();
    }
});
