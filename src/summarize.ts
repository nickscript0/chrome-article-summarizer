
import { calculatePageRank, makeGraph, getSentences } from "./text-rank";
import { Chart } from "chart.js";

const NUM_SUMMARY_SENTENCES = 5;

export function getPageText() {
    const rootDiv = document.createElement('div');
    rootDiv.style.padding = '50px';
    const textBlocks = findNodesWithNWords(10);
    const sentences = getSentences(textBlocks.join(' '));

    const result = summarizeSentences(sentences);
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
    const chart = _createChart([1, 2, 3, 4]);
    if (chart) rootDiv.appendChild(chart);
    return rootDiv;
}

function _createChart(pr_arr: Array<number>) {
    // <canvas id="myChart" width="400" height="400"></canvas>
    // <script>
    // var ctx = document.getElementById("myChart").getContext('2d');
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 400;
    canvasEl.height - 400;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    return canvasEl;
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

function findNodesWithNWords(minWords: number): Array<string> {
    const rejectCounter = new StringCounter();
    const acceptCounter = new StringCounter();
    const skipCounter = new StringCounter();

    const filter_by_word: NodeFilter = {
        acceptNode: n => {
            if (n.parentNode && ELEMENT_REJECT_BLACKLIST.includes(n.parentNode.nodeName.toLowerCase())) {
                rejectCounter.incr(n.parentNode.nodeName.toLocaleLowerCase());
                return NodeFilter.FILTER_REJECT;
            } else if (_wordCount(n.textContent) >= minWords) {
                acceptCounter.incr(n.parentNode && n.parentNode.nodeName);
                return NodeFilter.FILTER_ACCEPT;
            } else {
                skipCounter.incr(n.parentNode && n.parentNode.nodeName);
                return NodeFilter.FILTER_SKIP;
            }
        }

    };
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        // NodeFilter.SHOW_ALL,
        filter_by_word,
        false
    );

    let n;
    const matched_nodes: Array<string> = [];
    while (n = walker.nextNode()) {
        matched_nodes.push(n.textContent);
    }

    console.log(`Accepted Nodes:\n${acceptCounter.toString()}`);
    // console.log(`Skipped Nodes:\n${skipCounter.toString()}`);
    console.log(`Rejected Nodes:\n${rejectCounter.toString()}`);
    return matched_nodes;
}

function _wordCount(s: string | null): number {
    if (s === null || s.trim() === '') return 0;
    const words = s.match(/(\w+)/g);
    return (words) ? words.length : 0;
}