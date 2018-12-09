/**
 * Testing "document" notes:
 * - Closest I got to using puppeteer was https://github.com/direct-adv-interfaces/mocha-headless-chrome
 *   but could still not get the window.document programmatically. It required I run the tests
 *   in an html document <script>mocha.run();</script> and then from the CLI
 *   ./node_modules/.bin/mocha-headless-chrome --timeout=5000 -f test.html
 * - Decided to use JSDom which simply returns a document
 * - JSDom doesn't support treeWalker!!! https://github.com/tmpvar/jsdom/issues/539
 */

// TODO: Add tests by mocking getSelection with an article instead of just an empty string

import * as fs from 'fs';
import { JSDOM } from 'jsdom';
import { expect } from 'chai';

import { findNodesWithNWords, getTextBlocksFromDom, getNlpSentencesBlocks } from "../summarize";

// const document: Document = new JSDOM(`<!DOCTYPE html>`).window.document;
const window = newWindowFromString(`<!DOCTYPE html>`) as any;
const document = window.document;

window.getSelection = () => '';

describe('summarize', () => {
    describe('findNodesWithNWords', () => {
        const fourSentence = 'one two three four.';
        const fiveSentence = 'one two three four Five!';
        const tenSentence = 'one two three four Five, six, (seven) eight nine 10.';

        beforeEach(() => {
            while (document.body.hasChildNodes()) {
                const lastChild = document.body.lastChild;
                if (lastChild) document.body.removeChild(lastChild);
            }
        });

        it('should return 0 nodes if all have less than N words', () => {
            addPNodesToBody([fourSentence]);
            const nodes = findNodesWithNWords(10, document);
            expect(nodes.length).to.equal(0);
        });

        it('should ignore nodes with less than N words and keep nodes with that or more', () => {
            addPNodesToBody([fiveSentence, fourSentence, tenSentence]);
            const nodes = findNodesWithNWords(5, document);

            expect(nodes.length).to.equal(2);
            expect(nodes[0]).to.equal(fiveSentence);
            expect(nodes[1]).to.equal(tenSentence);
        });

        it('should ignore blacklisted nodes', () => {
            addPNodesToBody([fiveSentence]);
            const b = document.createElement('button');
            b.textContent = fiveSentence;
            document.body.appendChild(b);

            const nodes = findNodesWithNWords(2, document);

            expect(nodes.length).to.equal(1);
            expect(nodes[0]).to.equal(fiveSentence);
        });

        it('should include a element text', () => {
            addPNodesToBody([fiveSentence]);
            const linkText = 'some link text';
            const a = document.createElement('a');
            a.textContent = linkText;
            document.body.appendChild(a);
            addPNodesToBody([fourSentence]);

            const nodes = findNodesWithNWords(2, document);
            expect(nodes.length).to.equal(3);
            expect(nodes[0]).to.equal(fiveSentence);
            expect(nodes[1]).to.equal(linkText);
            expect(nodes[2]).to.equal(fourSentence);

        });
    });

    describe('getSentencesFromDocument', () => {
        const part11Sentence = '*part11Sentence: one two three four five, six, seven eight nine ten eleven*';
        const full10Sentence = 'one two three four Five, six, (seven) eight nine 10.';

        beforeEach(() => {
            while (document.body.hasChildNodes()) {
                const lastChild = document.body.lastChild;
                if (lastChild) document.body.removeChild(lastChild);
            }
        });

        it('should include non <p> elements text when above word count minimum', () => {
            addPNodesToBody([part11Sentence], 'span');
            const linkText = 'some link text above the min text count, 1, 2, 3';
            addPNodesToBody([linkText], 'a');
            addPNodesToBody([full10Sentence]);

            const sentences = getNlpSentencesBlocks(getTextBlocksFromDom(window)).sentences;

            expect(sentences[0]).to.equal(part11Sentence);
            expect(sentences[1]).to.equal(linkText);
            expect(sentences[2]).to.equal(full10Sentence);
        });

        it('should combine multiple <a> elements embedded in a <p> element', () => {
            // TODO: parse the following line correctly
            const html = `<!DOCTYPE html>
            <head><title>summarize test</title></head>
            <body>
                <p>Pond’s question was not rhetorical. She was expressing a sentiment that has become common among business owners and patent holders in countries like the USA, who are <a href="http://www.forbes.com/sites/wadeshepard/2017/09/27/amazon-com-the-place-where-american-dreams-are-stolen-by-chinese-counterfeiters/" target="_self">having their products knocked-off</a> on major e-commerce platforms by foreign counterfeiters <a href="http://www.forbes.com/sites/wadeshepard/2017/01/12/why-amazon-is-losing-its-battle-against-chinese-counterfeiters/" target="_self">who seemingly operate with impunity</a>.</p>
            </body>`;
            const testwin = newWindowFromString(html) as any;
            const expected1 = `Pond’s question was not rhetorical.`;
            const expected2 = `She was expressing a sentiment that has become common among business owners and patent holders in countries like the USA, who are having their products knocked-off on major e-commerce platforms by foreign counterfeiters who seemingly operate with impunity.`;

            const sentences = getNlpSentencesBlocks(getTextBlocksFromDom(testwin)).sentences;
            expect(sentences[0]).to.equal(expected1);
            expect(sentences[1]).to.equal(expected2);
        });
    });
});

enum Site {
    NYTIMES = 'NYTIMES',
    MEDIUM = 'MEDIUM',
    MEDIUM2 = 'MEDIUM2',
    VERGE = 'VERGE',
    CBC = 'CBC'
}

class Accuracies {
    expected: any;
    results: any;
    constructor() {
        this.results = {};
        this.expected = {};
        this.expected[Site.NYTIMES] = 97;
        this.expected[Site.MEDIUM] = 54;
        this.expected[Site.MEDIUM2] = 89;
        this.expected[Site.VERGE] = 100;
        this.expected[Site.CBC] = 80;
    }

    report(site: Site, reported: AccuracyResult) {
        this.results[site] = reported;
        expect(reported.matchExpected).gte(this.expected[site]);
    }

    getResults() {
        return this.results;
    }
}

class Timers {
    timers: Map<string, number>;
    results: Map<string, number>;

    constructor() {
        this.timers = new Map();
        this.results = new Map();
    }

    start(name) {
        this.timers.set(name, this._clock());
    }

    stop(name) {
        const start = this.timers.get(name);
        if (!start) throw new Error(`No start called for timer ${name}`);
        const result = this._clock() - start;
        this.results.set(name, result);
    }

    get(name) {
        const res = this.results.get(name);
        return (res) ? res : '';
    }

    _clock() {
        const t = process.hrtime();
        return Math.round((t[0] * 1000) + (t[1] / 1000000));
    }
}

function printResults(accuracies: Accuracies, timers: Timers) {
    return `Site\tMatch\tExtra\tTime\n`
        + `-----------------------------\n`
        + (<any>Object).entries(accuracies.getResults())
            .map(([k, v]) => `${k}\t${v.matchExpected}%\t${v.notExpected}%\t${timers.get(k)}ms`)
            .join('\n');
}

describe('getSentencesFromDocument real article test accuracy', () => {
    const accuracies = new Accuracies();
    const timers = new Timers();

    after(function () {
        console.log(`\n********************\nSentence extraction accuracies:\n${printResults(accuracies, timers)}\n********************`);
    });

    it('should handle nytimes format', async () => {
        const site = Site.NYTIMES;
        const testwin = await newWindowFromFile('src/test/res/nytimes1.html');
        timers.start(site);
        const sentences = getNlpSentencesBlocks(getTextBlocksFromDom(testwin)).sentences;
        // console.log(`NYTIMES NEW:\n${sentences.map((s, i) => `${i}: ${s}`).join('\n')}`);
        const accuracy = await rateSentencesMatch(sentences, 'src/test/res/nytimes1.sentences');
        // console.log(`ACCURACY: ${accuracy}`);
        timers.stop(site);
        accuracies.report(site, accuracy);
    });

    it('should handle medium format', async () => {
        const site = Site.MEDIUM;
        const testwin = await newWindowFromFile('src/test/res/medium1.html');
        timers.start(site);
        const sentences = getNlpSentencesBlocks(getTextBlocksFromDom(testwin)).sentences;
        // console.log(`SENTENCES:\n${sentences.map((s, i) => `${i}: ${s}`).join('\n')}`);
        const accuracy = await rateSentencesMatch(sentences, 'src/test/res/medium1.sentences');
        // console.log(`ACCURACY: ${accuracy}`);
        timers.stop(site);
        accuracies.report(site, accuracy);
    });

    it('should handle medium format #2', async () => {
        const site = Site.MEDIUM2;
        const testwin = await newWindowFromFile('src/test/res/medium2.html');
        timers.start(site);
        const sentences = getNlpSentencesBlocks(getTextBlocksFromDom(testwin)).sentences;
        // console.log(`SENTENCES:\n${sentences.map((s, i) => `${i}: ${s}`).join('\n')}`);
        const accuracy = await rateSentencesMatch(sentences, 'src/test/res/medium2.sentences');
        // console.log(`ACCURACY: ${accuracy}`);
        timers.stop(site);
        accuracies.report(site, accuracy);
    });

    it('should handle verge format', async () => {
        const site = Site.VERGE;
        const testwin = await newWindowFromFile('src/test/res/verge1.html');
        timers.start(site);
        const sentences = getNlpSentencesBlocks(getTextBlocksFromDom(testwin)).sentences;
        // console.log(`NYTIMES NEW:\n${sentences.map((s, i) => `${i}: ${s}`).join('\n')}`);
        const accuracy = await rateSentencesMatch(sentences, 'src/test/res/verge1.sentences');
        // console.log(`ACCURACY: ${accuracy}`);
        timers.stop(site);
        accuracies.report(site, accuracy);
    });

    it('should handle cbc format', async () => {
        const site = Site.CBC;
        const testwin = await newWindowFromFile('src/test/res/cbc1.html');
        timers.start(site);
        const sentences = getNlpSentencesBlocks(getTextBlocksFromDom(testwin)).sentences;
        // console.log(`CALCULATED SENTENCES:\n${sentences.map((s, i) => `${i}: ${s}`).join('\n')}`);
        const accuracy = await rateSentencesMatch(sentences, 'src/test/res/cbc1.sentences');
        // console.log(`ACCURACY: ${accuracy}`);
        timers.stop(site);
        accuracies.report(site, accuracy);
    });

    // it('compromise testing', async () => {
    //     const text = `Biologists and conservationists are rooting for a natural reunion between the two largest populations of grizzlies in the country, Dr. van Manen said.`
    //     const res = nlp(text).sentences().data().map(s => s.text);
    //     console.log(`NLP results:\n${res.map((s, i) => `${i}: ${s}`).join('\n')}`);
    // });
});

interface AccuracyResult {
    matchExpected: number; // Percentage that are in expected set
    notExpected: number; // Percentage that are not in expected set
}

async function rateSentencesMatch(sentences: Array<string>, expectedSentencesFilepath: string, ignoreEndPunctuation: boolean = false): Promise<AccuracyResult> {
    const expectedSentencesRaw = (await readFile(expectedSentencesFilepath)).split('\n');
    const expectedSentencesSet = (!ignoreEndPunctuation) ? new Set(expectedSentencesRaw) :
        new Set(expectedSentencesRaw.map(s => {
            return (s.endsWith('.') || s.endsWith('?') || s.endsWith('!')) ? s.slice(0, s.length - 1) : s;
        }));

    const actualSentencesSet = new Set(sentences.map(s => s.trim()));
    const intersection = new Set(Array.from(expectedSentencesSet).filter(x => actualSentencesSet.has(x)));
    // console.log(`MISSING FROM EXPECTED SENTENCES:\n${[...expectedSentencesSet].filter(x => !actualSentencesSet.has(x)).join('\n')}`); // DEBUG
    const notExpectedArr = [...actualSentencesSet].filter(x => !expectedSentencesSet.has(x));
    const notExpectedPercent = (notExpectedArr.length * 100 / actualSentencesSet.size).toFixed(2);
    return {
        matchExpected: parseFloat((intersection.size * 100 / expectedSentencesSet.size).toFixed(2)),
        notExpected: parseFloat(notExpectedPercent)
    };
}

function addPNodesToBody(nodeTexts: Array<string>, nodeType: string = 'p', d: Document = document) {
    nodeTexts.forEach(text => {
        const p = d.createElement('p');
        p.textContent = text;
        d.body.appendChild(p);
    });
    return d;
}

async function newWindowFromFile(htmlFile: string) {
    return newWindowFromString(await readFile(htmlFile));
}

function newWindowFromString(htmlString: string) {
    const w = new JSDOM(htmlString).window as any;
    // Mock getSelection due to https://github.com/jsdom/jsdom/issues/321
    w.getSelection = () => '';
    w.performance.now = () => null;
    return w;
}

// promisified fs.readFile
function readFile(filename: string): Promise<string> {
    return new Promise<string>((resolve, reject) =>
        fs.readFile(filename, (err, data) => (err) ? reject(err) : resolve(data.toString('utf-8')))
    );
}