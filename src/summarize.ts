
import { calculatePageRank, makeGraph } from "text-rank";

export function getPageText() {
    const rootDiv = document.createElement('div');
    const textBlocks = findNodesWithNWords(10);

    const summarizedSentences = summarizeSentences(textBlocks, 5);
    let i = 1;
    for (const text of summarizedSentences) {
        const p = document.createElement('p');
        p.textContent = `Block ${i}: ${text}`;
        // Font styling modeled off of nytimes
        p.style.fontFamily = `georgia, "times new roman", times, serif`;
        p.style.fontSize = '16px';
        p.style.color = 'black';
        rootDiv.appendChild(p);
        i += 1;
    }

    return rootDiv;
}

function summarizeSentences(sentences: Array<string>, numSummarySentences: number) {
    const textRankConfig = {
        "maxIter": 100,
        "dampingFactor": 0.85,
        "delta": 0.5
    };

    const graph = makeGraph(sentences);
    const result = calculatePageRank(graph, textRankConfig.maxIter,
        textRankConfig.dampingFactor, textRankConfig.delta);
    return result.getSentencesOrderedByOccurence(numSummarySentences);
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