// import { launch, Browser, Page } from 'puppeteer';

import { findNodesWithNWords } from "../summarize";
import { expect } from 'chai';




describe('findNodesWithNWords', () => {
    // let browser: Browser, page: Page;
    // beforeEach(async  () => {
    //     launch().then(async launchBrowser => {
    //         browser = launchBrowser;
    //         page = await browser.newPage();
    //         await page.setContent('<html><head><title>summarize-test</title></head><body></body></html>');
    //         // await browser.close();
    //     });
    // });

    // afterEach(async () => {
    //     await browser.close();
    // });

    it('should ignore nodes with less than N words', () => {
        // const result = hello();
        // expect(result).to.equal('Hello World!');
        const doc = createDocWithText(page, [`Here is a sentence with, less than 10 words.`]);
        expect(findNodesWithNWords(10, doc).length).to.equal(0);
    });
});

function createDocWithText(page: Page, nodeTexts: Array<string>) {
    const doc = document.implementation.createHTMLDocument('summarize-test');

    nodeTexts.forEach(text => {
        const p = doc.createElement('p');
        p.textContent = text;
        doc.body.appendChild(p);
    });
    return doc;
}
