/**
 * Article Summarizer Chrome Extension
 * - See here why web workers can't be used in content scripts (without a proxy) https://github.com/Rob--W/chrome-api/tree/master/worker_proxy
 */

/**
* TODOs:
* 0. DO THIS NEXT: 
   - In summarized view, add button to reveal entire article with textranked sentences in bold!
   - Also in the reveal entire article view consider shading sentences darkness of grey based on their rank
   - To do this really right, would need to preserve paragraph structure which is probably much more difficult as I currently don't detect paragraphs just sentences. Could be as easy as detecting <p> elements
* 1. Make num sentences easily adjustable in the UI
* 2. Allow seeing the context of a sentence (maybe on left-click it shows more and more sentences before and after, and right click hides them again)
* 5. a. Extract TextRank and <html sentence extraction> to their own repo
*    b. Add unit tests for TextRank
* 6. Handle duplicate subset sentences e.g. https://medium.com/sketchdeck-developer-blog/what-i-wish-i-knew-when-i-became-cto-fdc934b790e3
* 8. Summarize text selection in an inline overlay window (as we don't want to reload the page in this case) - create an iframe "cartoon text" dialog window
* 9. Responsive web design: https://developers.google.com/web/fundamentals/design-and-ux/responsive/
* 10. Turn into a FF mobile extension
* 11. Consider using document.querySelectorAll("body *") etc.. instead of treeWalker, is this more efficient??
*/

import { getTextBlocksFromDom } from "./summarize";
import { Commands, InputPayload, Timer } from './messages';
import { kill_sticky_headers } from './kill-sticky-headers';


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === Commands.ToggleSummarize) {
        const startTime = Date.now();
        const t = new Timer();
        const textBlocks = getTextBlocksFromDom(window);
        t.logTimeAndReset('text from dom');
        const payload: InputPayload = {
            textBlocks: textBlocks,
            title: document.title,
            startTime: startTime,
            url: document.location ? document.location.href : '',
            timings: t.serialize()
        };

        sendResponse({
            data: payload
        });
    } else if (request.command === Commands.KillStickies) {
        kill_sticky_headers();
    }
});

// async function main() {
//     const { message, sender, sendResponse } = await onMessageListener();
//     console.log(`MESSAGE IS ${message}`);
//     if (message.command === Commands.ToggleSummarize) {
//         const startTime = Date.now();
//         const textBlocks = getTextBlocksFromDom(window);
//         const payload: InputPayload = {
//             textBlocks: textBlocks,
//             title: document.title,
//             startTime: startTime,
//             url: document.location.href
//         };
//         console.log(`sending repsonse !!! ${payload.url}, ${payload.startTime}`);
//         sendResponse(payload);
//     }

// }


function onMessageListener(): Promise<{ message: any, sender: chrome.runtime.MessageSender, sendResponse: Function }> {
    return new Promise((resolve, reject) => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            return resolve({ message, sender, sendResponse });
        });
    });
}

// main();