// Finds any dates in the doc and adds their relative date

import * as chrono from 'chrono-node';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import { getNodeFilter } from './summarize';

export function addRelativeDatesToDocument() {
    console.log(`addRealtiveDatesToDocument!`);
    let count = 0;
    textNodes(document).forEach(n => {
        count++;
        convert(n as HTMLElement);
    });
    console.log(`Walked ${count} nodes!`);
}

interface ParsedResult {
    ref: any;
    index: number;
    text: string;
    tags: any;
    start: {
        knownValues: any;
        impliedValues: any;
    }
}

function convert(currentElement: HTMLElement) {
    if (!currentElement.textContent) return;
    const currentText = currentElement.textContent;

    // TODO: for now keep it simple and use parseDate
    // Can get more complicated and do chrono.parse for more information (multiple dates etc..)
    const res = chrono.strict.parseDate(currentText);
    if (res) {
        console.log(
            `Chrono found a date for text:\nTEXT:${currentText}\nCHRONO:`,
            res
        );
        const parsed: ParsedResult = chrono.strict.parse(currentText)[0];
        console.log(`PARSED`, parsed);
        const start = currentText.slice(0, parsed.index + parsed.text.length);
        const end = currentText.slice(parsed.index + parsed.text.length);
        // const newText = `${currentText} (${dayjs(res).fromNow()})`;
        const newText = `${start} (${dayjs(res).fromNow()})${end}`;

        // TODO: I think I could split this into 3 text nodes (same way summarizer does) and then the relative time could have font, bold, color...
        currentElement.textContent = newText;
    } else {
        // console.log(`NO_DATE_FOUND:`, currentText);
    }
}

function textNodes(doc: Document) {
    let n: Node | null;
    const textNodes: Node[] = [],
        walk = document.createTreeWalker(
            doc,
            NodeFilter.SHOW_TEXT,
            getNodeFilter({ minWords: 2, skipSubtrees: false }),
            false
        );
    while ((n = walk.nextNode())) textNodes.push(n);
    return textNodes;
}
