import * as nlp from 'compromise';

import { calculatePageRank, makeGraph } from './text-rank';
import { SummaryData, Timer } from './messages';

const NUM_SUMMARY_SENTENCES = 5;
const MIN_WORDS_SENTENCE = 10;

export function summarizeTextBlocks(
    textBlocks: string[],
    docTitle: string
): SummaryData {
    const t = new Timer();
    const { sentences, nlpBlocks, nlpTimer } = getNlpSentencesBlocks(
        textBlocks
    );
    t.logTimeAndReset('nlp get sentences');
    const result = summarizeSentences(sentences);
    t.logTimeAndReset('page rank summarize');

    const title = docTitle;
    const tsub = new Timer();
    const sentencesR = result.getSentencesOrderedByOccurence();
    tsub.logTimeAndReset('-->getSentencesOrderedByOccurence');
    const textStats = result.getStatsText(NUM_SUMMARY_SENTENCES);
    tsub.logTimeAndReset('-->getStatsText');
    const wordStats = getWordStats(nlpBlocks);
    tsub.logTimeAndReset('-->getWordStats');
    const pageRanks = result.allPageRanks();
    tsub.logTimeAndReset('-->allPageRanks');
    const numSummarySentences = NUM_SUMMARY_SENTENCES;
    t.logTimeAndReset('get stats');
    return {
        title,
        sentences: sentencesR,
        textStats,
        wordStats,
        pageRanks,
        numSummarySentences,
        timing: t.serialize(),
        nlpTiming: nlpTimer.serialize()
    };
}

function getWordStats(nlpBlocks: Array<any>): string {
    const NUM_WORD_STATS = 5;
    function nbSubsetToArr(nlpBlocks, subsetFunc) {
        const count2d = nlpBlocks.map(nb =>
            subsetFunc(nb)
                .data()
                .filter(d => d)
                .map(d => d.normal.trim())
                .filter(t => t !== '')
        );
        return Array.prototype.concat(...count2d);
    }

    const peopleArr = nbSubsetToArr(nlpBlocks, a => a.people());
    const placesArr = nbSubsetToArr(nlpBlocks, a => a.places());
    const nounsArr = nbSubsetToArr(nlpBlocks, a => a.nouns());
    const thingsArr = [...nounsArr]
        .filter(x => !new Set(peopleArr).has(x))
        .filter(x => !new Set(placesArr).has(x));

    const topPeople = new StringCounter(peopleArr)
        .topN(NUM_WORD_STATS)
        .join(', ');
    const topPlaces = new StringCounter(placesArr)
        .topN(NUM_WORD_STATS)
        .join(', ');
    const topThings = new StringCounter(thingsArr)
        .topN(NUM_WORD_STATS)
        .join(', ');

    return `Top People: ${topPeople}
Top Places: ${topPlaces}
Top Nouns: ${topThings}
`;
}

interface NlpSubsets {
    sentences: Array<string>;
    nlpBlocks: Array<object>;
    nlpTimer: Timer;
}

export function getTextBlocksFromDom(theWindow: Window): string[] {
    const rawSelection = theWindow.getSelection();
    const selection = rawSelection ? rawSelection.toString().trim() : '';
    const theDocument = theWindow.document;

    const t = new Timer();
    const textBlocks =
        selection === ''
            ? findNodesWithNWords(MIN_WORDS_SENTENCE, theDocument)
            : [selection];
    t.logTimeAndReset('treeWalk');
    return textBlocks;
}

export function getNlpSentencesBlocks(textBlocks: string[]): NlpSubsets {
    // TODO: seems simpler to just join the textBlocks into one big string instead of what
    // I had before, performance difference is minor
    const t = new Timer();
    const text = textBlocks.join('\n');
    t.logTimeAndReset('textBlocks.join() call');
    const nlpBlocks = nlp(text);
    t.logTimeAndReset('nlp(textBlock) calls');
    const sentencesUntrimmed = nlpBlocks.sentences().data();
    t.logTimeAndReset('nlp.sentences() calls');
    // const sentencesUntrimmed = Array.prototype.concat(...sentences2d);
    // t.logTimeAndReset('flatten array');
    const sentences = sentencesUntrimmed.map(s => s.text.trim());
    t.logTimeAndReset('trim() calls');

    return {
        sentences,
        nlpBlocks,
        nlpTimer: t
    };
}

function summarizeSentences(sentences: Array<string>) {
    const textRankConfig = {
        maxIter: 100,
        dampingFactor: 0.85,
        delta: 0.5
    };

    const graph = makeGraph(sentences);
    const result = calculatePageRank(
        graph,
        textRankConfig.maxIter,
        textRankConfig.dampingFactor,
        textRankConfig.delta
    );
    return result;
}

// Skip these element types and all their children
const ELEMENT_REJECT_BLACKLIST = [
    'style',
    'script',
    'button',
    'nav',
    'img',
    'noscript',
    'iframe'
];

class StringCounter {
    private stringCounts: Map<string, number>;
    constructor(initArray: Array<string> | null = null) {
        this.stringCounts = new Map();

        if (initArray) {
            initArray.forEach(s => this.incr(s));
        }
    }

    incr(s: string | null) {
        if (s === null) s = '<<null>>';
        const last = this.stringCounts.get(s);
        const next = last ? last + 1 : 1;
        this.stringCounts.set(s, next);
    }

    topN(n) {
        return Array.from(this.stringCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(el => `${el[0]} (${el[1]})`);
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
// const SHOW_ALL = 0xFFFFFFFF;

/**
 * How to improve accuracy:
 * cbc: If we are going to use a pText node's text (which includes all sub children text), then we should remove any BLACKLISTed nodes from the subtree first
 * medium1: include 'li' nodes in the pText check (this causes more false positives in the other articles though and isn't worth it)
 * @param minWords
 * @param theDocument
 */
export function findNodesWithNWords(
    minWords: number,
    theDocument: Document
): Array<string> {
    const rejectCounter = new StringCounter();
    const acceptCounter = new StringCounter();
    const skipCounter = new StringCounter();
    const matchedNodes: Set<string> = new Set();

    const walker = theDocument.createTreeWalker(
        theDocument.body,
        SHOW_TEXT,
        // SHOW_ALL,
        getNodeFilter({
            minWords,
            rejectCounter,
            acceptCounter,
            skipCounter,
            matchedNodes,
            skipSubtrees: true
        }),
        false
    );

    while (walker.nextNode()) {
        // Do Nothing
    }

    // console.log(`Accepted Nodes:\n${acceptCounter.toString()}`);
    // console.log(`Skipped Nodes:\n${skipCounter.toString()}`);
    // console.log(`Rejected Nodes:\n${rejectCounter.toString()}`);
    return Array.from(matchedNodes);
}

interface NodeFilterConfig {
    minWords: number;
    rejectCounter?: StringCounter;
    acceptCounter?: StringCounter;
    skipCounter?: StringCounter;
    matchedNodes?: Set<string>;
    skipSubtrees: boolean;
}

export function getNodeFilter(config: NodeFilterConfig) {
    const {
        minWords,
        rejectCounter,
        acceptCounter,
        skipCounter,
        matchedNodes,
        skipSubtrees
    } = config;

    const filterByWord: NodeFilter = {
        acceptNode: n => {
            if (_classBlacklisted(n)) {
                n.parentNode && _removeTree(n.parentNode);
                return FILTER_REJECT;
            } else if (
                n.parentNode &&
                ELEMENT_REJECT_BLACKLIST.includes(
                    n.parentNode.nodeName.toLowerCase()
                )
            ) {
                rejectCounter &&
                    rejectCounter.incr(n.parentNode.nodeName.toLowerCase());
                return FILTER_REJECT;
            } else if (
                skipSubtrees &&
                n.parentNode &&
                ['p'].includes(n.parentNode.nodeName.toLowerCase())
            ) {
                const pText = n.parentNode.textContent;
                if (pText && _wordCount(pText) >= minWords) {
                    acceptCounter &&
                        acceptCounter.incr(
                            n.parentNode && n.parentNode.nodeName
                        );
                    matchedNodes && matchedNodes.add(pText);
                }
                // We are done with this node subtree as n.parentNode.textContent will contain all text in the subtree
                return FILTER_REJECT;
            } else if (_wordCount(n.textContent) >= minWords) {
                acceptCounter &&
                    acceptCounter.incr(n.parentNode && n.parentNode.nodeName);
                if (n.textContent)
                    matchedNodes && matchedNodes.add(n.textContent);
                return FILTER_ACCEPT;
            } else {
                skipCounter &&
                    skipCounter.incr(n.parentNode && n.parentNode.nodeName);
                return FILTER_SKIP;
            }
        }
    };
    return filterByWord;
}

function _removeTree(node: Node) {
    while (node.lastChild) {
        node.removeChild(node.lastChild);
    }
}

function _classBlacklisted(n: Node | null): boolean {
    if (!n) return false;
    const el = n.parentNode as HTMLElement;
    // if (el.className) console.log(`CLASSNAME is ${el.className}`);
    if (
        el.className !== undefined &&
        el.className.includes &&
        el.className.includes('comments-panel')
    ) {
        // console.log(`BLACKLISTED CLASSNAME is ${el.className}`);
        return true;
    } else {
        return false;
    }
}

function _wordCount(s: string | null): number {
    if (s === null || s.trim() === '') return 0;
    const words = s.match(/(\w+)/g);
    return words ? words.length : 0;
}
