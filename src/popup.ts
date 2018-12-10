console.log(`popup.ts loaded`);
import { Commands, queryCurrentTab } from './messages';

async function main() {
    let app;

    // TODO: cleanup browser/chrome selection, what is the accepted way to do this?
    try {
        app = browser;
    } catch (e) {
        console.log(`Chrome detected, using 'chrome' object instead of 'browser'`);
        app = chrome;
    }

    const summarizeButton = document.getElementById('summarize-button');
    summarizeButton && summarizeButton.addEventListener("click", async (ev) => {
        const currentTab = await queryCurrentTab();
        currentTab.openerTabId && currentTab.id && browser.tabs.remove(currentTab.id);
        window.close();
        app.runtime.sendMessage({ command: "toggle-summarize", openerTabId: currentTab.openerTabId })
            .then(() => {
                console.log('Initiated toggle-summarize');
            });
    });

    const killStickyButton = document.getElementById('kill-sticky-button');
    killStickyButton && killStickyButton.addEventListener("click", async (ev) => {
        const currentTab = await queryCurrentTab();
        currentTab.openerTabId && currentTab.id && browser.tabs.remove(currentTab.id);

        window.close();
        app.runtime.sendMessage({ command: Commands.KillStickies, openerTabId: currentTab.openerTabId })
            .then(() => {
                console.log(`Initiated kill-sticky-headers`);
            });
    });

}

main();