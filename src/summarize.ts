import * as nlp from 'compromise';
import { Chart } from "chart.js";

import { calculatePageRank, makeGraph, getSentences } from "./text-rank";

const NUM_SUMMARY_SENTENCES = 5;
const MIN_WORDS_SENTENCE = 10;

export function getPageText() {
    const rootDiv = document.createElement('div');
    rootDiv.style.padding = '50px';
    const result = summarizeSentences(getSentencesFromDocument(document));
    let i = 1;
    for (const text of result.getSentencesOrderedByOccurence(NUM_SUMMARY_SENTENCES)) {
        let p = _createParagraph(text);
        rootDiv.appendChild(p);
        i += 1;
    }

    // Add stats text
    const pre = document.createElement('pre');
    pre.textContent = result.getStatsText(NUM_SUMMARY_SENTENCES);
    // pre.style.fontWeight = 'bold';
    rootDiv.appendChild(pre);
    const chart = _createChart(result.allPageRanks(), NUM_SUMMARY_SENTENCES);
    if (chart) rootDiv.appendChild(chart);
    return rootDiv;
}


export function getSentencesFromDocument(theDocument: Document, useNlp = true): Array<string> {
    const textBlocks = findNodesWithNWords(MIN_WORDS_SENTENCE, theDocument);
    if (useNlp) {
        const sentences2d = textBlocks.map(b => nlp(b).sentences().data().map(s => s.text.trim()));
        return Array.prototype.concat(...sentences2d);
    } else {
        return getSentences(textBlocks.join(''));
    }
}

function _createChart(prArr: Array<number>, num_summary_sentences: number) {
    // <canvas id="myChart" width="400" height="400"></canvas>
    // <script>
    // var ctx = document.getElementById("myChart").getContext('2d');
    const canvasEl = document.createElement('canvas');
    // canvasEl.width = 200;
    // canvasEl.height = 200;
    // canvasEl.style.width = '400px';
    // canvasEl.style.height = '400px';
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    const barChartData = {
        labels: Array.from(Array(prArr.length).keys()).map(x => x.toString()),
        datasets: [{
            label: 'Page Rank Values',
            // backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
            // borderColor: window.chartColors.red,
            borderWidth: 1,
            data: prArr,
            backgroundColor: Array(num_summary_sentences).fill('rgba(75, 192, 192, 0.2)'),
            borderColor: Array(num_summary_sentences).fill('rgba(75, 192, 192, 1)')
        }]
    };
    new Chart(ctx, {
        type: 'bar',
        data: barChartData,
        options: {
            // maintainAspectRatio: false,
            // responsive: false
        }
    });

    const div = document.createElement('div');
    div.style.width = '800px';
    div.style.height = '400px';
    div.style.textAlign = 'center';
    div.appendChild(canvasEl);
    return div;
}


function _createParagraph(text) {
    const p = document.createElement('p');
    p.textContent = text;
    // Font styling modeled off of nytimes
    p.style.fontFamily = `georgia, "times new roman", times, serif`;
    p.style.fontSize = '16px';
    p.style.color = 'black';
    return p;
}

function summarizeSentences(sentences: Array<string>) {
    const textRankConfig = {
        "maxIter": 100,
        "dampingFactor": 0.85,
        "delta": 0.5
    };

    const graph = makeGraph(sentences);
    const result = calculatePageRank(graph, textRankConfig.maxIter,
        textRankConfig.dampingFactor, textRankConfig.delta);
    return result;
}

// Skip these element types and all their children
const ELEMENT_REJECT_BLACKLIST = ['style', 'script', 'button', 'nav', 'img', 'noscript'];

class StringCounter {
    private stringCounts: Map<string, number>;
    constructor() {
        this.stringCounts = new Map();
    }

    incr(s: string | null) {
        if (s === null) s = '<<null>>';
        const last = this.stringCounts.get(s);
        const next = (last) ? last + 1 : 1;
        this.stringCounts.set(s, next);
    }

    toString() {
        return Array.from(this.stringCounts.keys())
            .map(k => `${k}: ${this.stringCounts.get(k)}`)
            .join('\n');
    }
}

// Should use NodeFilter.FILTER_ACCEPT
// but for JSDOM they're not defined yet see
// -- https://github.com/nhunzaker/jsdom/commit/ca3b6c234875200ce54a1494d61589112289b654
// -- https://github.com/tmpvar/jsdom/issues/317
const FILTER_ACCEPT = 1;
const FILTER_REJECT = 2;
const FILTER_SKIP = 3;
const SHOW_TEXT = 4;

/**
 * How to improve accuracy:
 * cbc: If we are going to use a pText node's text (which includes all sub children text), then we should remove any BLACKLISTed nodes from the subtree first
 * medium1: include 'li' nodes in the pText check (this causes more false positives in the other articles though and isn't worth it)
 * @param minWords
 * @param theDocument
 */
export function findNodesWithNWords(minWords: number, theDocument: Document): Array<string> {
    const rejectCounter = new StringCounter();
    const acceptCounter = new StringCounter();
    const skipCounter = new StringCounter();
    const matched_nodes: Set<string> = new Set();

    const filter_by_word: NodeFilter = {
        acceptNode: n => {
            if (n.parentNode && ELEMENT_REJECT_BLACKLIST.includes(n.parentNode.nodeName.toLowerCase())) {
                rejectCounter.incr(n.parentNode.nodeName.toLowerCase());
                return FILTER_REJECT;
            } else if (n.parentNode && ['p'].includes(n.parentNode.nodeName.toLowerCase())) {
                const pText = n.parentNode.textContent;
                if (pText && _wordCount(pText) >= minWords) {
                    acceptCounter.incr(n.parentNode && n.parentNode.nodeName);
                    matched_nodes.add(pText);
                }
                // We are done with this node subtree as n.parentNode.textContent will contain all text in the subtree
                return FILTER_REJECT;
            } else if (_wordCount(n.textContent) >= minWords) {
                acceptCounter.incr(n.parentNode && n.parentNode.nodeName);
                if (n.textContent) matched_nodes.add(n.textContent);
                return FILTER_ACCEPT;
            } else {
                skipCounter.incr(n.parentNode && n.parentNode.nodeName);
                return FILTER_SKIP;
            }
        }

    };
    const walker = theDocument.createTreeWalker(
        theDocument.body,
        SHOW_TEXT,
        // NodeFilter.SHOW_ALL,
        filter_by_word,
        false
    );

    let n;
    while (n = walker.nextNode()) {
    }

    // console.log(`Accepted Nodes:\n${acceptCounter.toString()}`);
    // console.log(`Skipped Nodes:\n${skipCounter.toString()}`);
    // console.log(`Rejected Nodes:\n${rejectCounter.toString()}`);
    return Array.from(matched_nodes);
}

function _wordCount(s: string | null): number {
    if (s === null || s.trim() === '') return 0;
    const words = s.match(/(\w+)/g);
    return (words) ? words.length : 0;
}