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

import { findNodesWithNWords } from "../summarize";

const document: Document = new JSDOM(`<!DOCTYPE html>`).window.document;

describe('findNodesWithNWords', () => {
    const fourSentence = 'one two three four.';
    const fiveSentence = 'one two three four Five!';
    const tenSentence = 'one two three four Five, six, (seven) eight nine 10.';

    it('should ignore nodes with less than N words', () => {
        createDocWithText(document, [fourSentence]);
        const nodes = findNodesWithNWords(10, document);
        expect(nodes.length).to.equal(0);
    });

    it('should ignore nodes with less than N words and keep nodes with that or more', () => {
        createDocWithText(document, [fiveSentence, fourSentence, tenSentence]);
        const nodes = findNodesWithNWords(5, document);

        expect(nodes.length).to.equal(2);
        expect(nodes[0]).to.equal(fiveSentence);
        expect(nodes[1]).to.equal(tenSentence);
    });

    it('should ignore blacklisted nodes', () => {
        createDocWithText(document, [fiveSentence]);
        const b = document.createElement('button');
        b.textContent = fiveSentence;
        document.body.appendChild(b);

        const nodes = findNodesWithNWords(2, document);

        expect(nodes.length).to.equal(1);
        expect(nodes[0]).to.equal(fiveSentence);
    });
});


function createDocWithText(doc: Document, nodeTexts: Array<string>) {
    // const doc = document.implementation.createHTMLDocument('summarize-test');
    while (doc.body.hasChildNodes()) {
        const lastChild = doc.body.lastChild;
        if (lastChild) doc.body.removeChild(lastChild);
    }

    nodeTexts.forEach(text => {
        const p = doc.createElement('p');
        p.textContent = text;
        doc.body.appendChild(p);
    });
    return doc;
}
