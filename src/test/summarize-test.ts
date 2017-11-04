/**
 * Testing "document" notes:
 * - Closest I got to using puppeteer was https://github.com/direct-adv-interfaces/mocha-headless-chrome
 *   but could still not get the window.document programmatically. It required I run the tests
 *   in an html document <script>mocha.run();</script> and then from the CLI
 *   ./node_modules/.bin/mocha-headless-chrome --timeout=5000 -f test.html
 * - Decided to use JSDom which simply returns a document
 * - JSDom doesn't support treeWalker!!! https://github.com/tmpvar/jsdom/issues/539
 */


import { JSDOM } from 'jsdom';
import { expect } from 'chai';

import { findNodesWithNWords, getSentencesFromDocument } from "../summarize";

const document: Document = new JSDOM(`<!DOCTYPE html>`).window.document;

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
            console.log(`RESULT IS: ${JSON.stringify(nodes)}`);
            expect(nodes[0]).to.equal(fiveSentence);
            expect(nodes[1]).to.equal(linkText);
            expect(nodes[2]).to.equal(fourSentence);

        });
    });

    describe('getSentencesFromDocument', () => {
        const part11Sentence = '*part11Sentence: one two three four five, six, seven eight nine ten eleven*';
        const part5Sentence = '*part5Sentence: one two three four Five*';
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

            const sentences = getSentencesFromDocument(document);

            expect(sentences.length).to.equal(1);
            let expected = `${part11Sentence}${linkText}${full10Sentence}`;
            // TODO: should we ignore periods?
            expected = expected.slice(0, expected.length - 1);
            expect(sentences[0]).to.equal(expected);
        });

        it('should combine multiple <a> elements embedded in a <p> element', () => {
            // TODO: parse the following line correctly
            const html = `<!DOCTYPE html>
            <head><title>summarize test</title></head>
            <body>
                <p>Pond’s question was not rhetorical. She was expressing a sentiment that has become common among business owners and patent holders in countries like the USA, who are <a href="http://www.forbes.com/sites/wadeshepard/2017/09/27/amazon-com-the-place-where-american-dreams-are-stolen-by-chinese-counterfeiters/" target="_self">having their products knocked-off</a> on major e-commerce platforms by foreign counterfeiters <a href="http://www.forbes.com/sites/wadeshepard/2017/01/12/why-amazon-is-losing-its-battle-against-chinese-counterfeiters/" target="_self">who seemingly operate with impunity</a>.</p>
            </body>`;
            const testdoc: Document = new JSDOM(html).window.document;
            const expected1 = `Pond’s question was not rhetorical`;
            const expected2 = `She was expressing a sentiment that has become common among business owners and patent holders in countries like the USA, who are having their products knocked-off on major e-commerce platforms by foreign counterfeiters who seemingly operate with impunity`;

            const sentences = getSentencesFromDocument(testdoc);
            expect(sentences[0]).to.equal(expected1);
            expect(sentences[1]).to.equal(expected2);
            // expect(1).to.equal(2);
        });
    });
});

function addPNodesToBody(nodeTexts: Array<string>, nodeType: string = 'p', d: Document = document) {
    nodeTexts.forEach(text => {
        const p = d.createElement('p');
        p.textContent = text;
        d.body.appendChild(p);
    });
    return d;
}
