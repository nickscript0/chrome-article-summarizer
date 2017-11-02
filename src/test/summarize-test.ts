import { launch, Browser, Page } from 'puppeteer';

import { findNodesWithNWords } from "../summarize";
import { expect } from 'chai';


const OUTER_CONSOLE = console;

/**
 * REFERENCES
 * TODO: JSDom as a simple alternative if can't get Puppeteer working sufficiently
 * Puppeteer docs: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
 *  -- JSHandle and page.evaluate both sound promising
 * Goode exmpale of using document https://github.com/GoogleChrome/puppeteer/issues/681
 * Good example of async/await in Mocha https://zaiste.net/posts/modern_node_js_async_await_based_testing_with_mocha_chai/
 * 
 * The following may have hints at how to access to the DOM:
 * https://github.com/GoogleChrome/puppeteer/issues/111
 * https://github.com/GoogleChrome/puppeteer/issues/613
 * 
 * LATEST TODO: This is probably the answer https://github.com/direct-adv-interfaces/mocha-headless-chrome
 * it is referenced by the official puppeteer docs: https://github.com/GoogleChrome/puppeteer/tree/master/examples
 */



describe('findNodesWithNWords', () => {
    // let browser: Browser, page: Page;
    // beforeEach(async (done) => {
    //     launch().then(async launchBrowser => {
    //         console.log(`START`);
    //         browser = launchBrowser;
    //         page = await browser.newPage();
    //         console.log(`await newPage`);
    //         await page.setContent('<html><head><title>summarize-test</title></head><body></body></html>');
    //         console.log(`await setContent`);
    //         await page.evaluate(() => {
    //             console.log(`await evaluate`);
    //             if(!document) {
    //                 console.log(`DOCUMENT NULL`);
    //                 return;
    //             } else {
    //                 document.createElement('p');
    //                 console.log(`CREATE ELEMENT!!!`);
    //             }
    //             done();
    //         });            
    //         // document = <Document> await page.evaluateHandle('document');
    //         // await browser.close();
    //     });
    // });

    // afterEach(async () => {
    //     // await browser.close();
    // });

    it('should ignore nodes with less than N words', async () => {
        // const result = hello();
        // expect(result).to.equal('Hello World!');
        // const doc = createDocWithText(page, [`Here is a sentence with, less than 10 words.`]);
        // expect(findNodesWithNWords(10, doc).length).to.equal(0);
        launch().then(async launchBrowser => {
            console.log(`START`);
            const browser = launchBrowser;
            const page = await browser.newPage();
            console.log(`await newPage`);
            await page.setContent('<html><head><title>summarize-test</title></head><body><p>hi</p></body></html>');
            console.log(`await setContent`);
            // await page.evaluate(() => {
            //     console.log(`await evaluate`);
            //     if (!document) {
            //         console.log(`DOCUMENT NULL`);
            //         return;
            //     } else {
            //         document.createElement('p');
            //         console.log(`CREATE ELEMENT!!!`);
            //     }
            // });

            // const bodyHandle = await page.$('body');
            // const html = await page.evaluate(body => body.innerHTML, bodyHandle);
            // await bodyHandle.dispose();
            // console.log(`html is ${html}`);

            // let page = await browser.newPage();
            await page.evaluate(() => {
                let el = document.createElement('textarea');
                document.body.appendChild(el);
                log(`Appended child to document!!`);
                expect(1).to.equal(2);
                // OUTER_CONSOLE.log(`Appended child to document!!`);
                // el.focus();
            });

            // const aHandle = await page.evaluateHandle('document');
            // const document = await page.evaluate(d => d, aHandle);
            // console.log(`document is ${JSON.stringify(document)}`);
            // createDocWithText(document, [`Here is a sentence with, less than 10 words.`]);
            await browser.close();
            // document = <Document> await page.evaluateHandle('document');
            // await browser.close();
        });
    });
});

function log(m) {
    console.log(m);
}

function createDocWithText(doc: Document, nodeTexts: Array<string>) {
    // const doc = document.implementation.createHTMLDocument('summarize-test');

    nodeTexts.forEach(text => {
        const p = doc.createElement('p');
        p.textContent = text;
        doc.body.appendChild(p);
    });
    return doc;
}
