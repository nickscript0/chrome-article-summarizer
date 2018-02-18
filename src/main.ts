/**
 * Article Summarizer Chrome Extension
 * - See here why web workers can't be used in content scripts (without a proxy) https://github.com/Rob--W/chrome-api/tree/master/worker_proxy
 */

/**
* TODOs:
* 1. Make num sentences easily adjustable in the UI
* 5. a. Extract TextRank and <html sentence extraction> to their own repo
*    b. Add unit tests for TextRank
* 6. Handle duplicate subset sentences e.g. https://medium.com/sketchdeck-developer-blog/what-i-wish-i-knew-when-i-became-cto-fdc934b790e3
* 8. Summarize text selection in an inline overlay window (as we don't want to reload the page in this case) - create an iframe "cartoon text" dialog window
* 9. Responsive web design: https://developers.google.com/web/fundamentals/design-and-ux/responsive/
* 10. Turn into a FF mobile extension
*/

import { getTextBlocksFromDom } from "./summarize";
import { Commands, InputPayload, Timer } from './messages';

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
            url: document.location.href,
            timings: t.serialize()
        };

        sendResponse({
            data: payload
        });
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