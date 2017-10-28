/**
 * Article Summarizer Chrome Extension
 */

import { getPageText } from "summarize";
// import { highlight_op, TextHighlight, Highlight } from "highlight";

function main() {
    console.log(`Welcome to chrome-article-summarizer!`);
    getPageText();
}

main();