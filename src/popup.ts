import { Commands, queryCurrentTab, PortName } from './messages';

async function main() {
    const loadedTab = await queryCurrentTab();
    console.log(`popup.ts loaded (tabId=${loadedTab.id})`);

    const port = chrome.runtime.connect({ name: PortName.popup });

    const summarizeButton = document.getElementById('summarize-button');
    summarizeButton && summarizeButton.addEventListener("click", async (ev) => {
        const currentTab = await queryCurrentTab();
        // console.log(`popup.ts summarize click, about to browser.tabs.remove(), currentTab=${JSON.stringify(currentTab)}`);
        // currentTab.openerTabId && currentTab.id && browser.tabs.remove(currentTab.id);

        console.log(`popup.ts skip window.close() sendMessage!`);
        // window.close();
        // console.log(`popup.ts sendMessage toggle-summarize to background openerTabId=${currentTab.openerTabId}`);
        const articleTabId = currentTab.id; // TODO: Does this work in desktop? If not consider currentTab.openerTabId || currentTab.id
        port.postMessage({ command: Commands.PopupToggleSummarize, articleTabId });
        // currentTab.openerTabId && currentTab.id && browser.tabs.remove(currentTab.id);

        // .then(() => {
        //     console.log('Initiated toggle-summarize');
        // });
    });

    const killStickyButton = document.getElementById('kill-sticky-button');
    killStickyButton && killStickyButton.addEventListener("click", async (ev) => {
        const currentTab = await queryCurrentTab();
        // currentTab.openerTabId && currentTab.id && browser.tabs.remove(currentTab.id);

        window.close();
        const articleTabId = currentTab.id; // TODO: Does this work in desktop? If not consider currentTab.openerTabId || currentTab.id
        port.postMessage({ command: Commands.PopupKillStickies, articleTabId });
        // currentTab.openerTabId && currentTab.id && browser.tabs.remove(currentTab.id);
        // 
        // .then(() => {
        //     console.log(`Initiated kill-sticky-headers`);
        // });
    });

}

main();
