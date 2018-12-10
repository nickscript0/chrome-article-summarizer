import {
    Commands, InputPayload, WorkerPayload,
    WorkerPayloadCommand, InputPayloadCommand, queryCurrentTab
} from './messages';

// key: tab.id, value: url string or null if not in summary mode
let tabsInSummaryMode: { [tabid: number]: string | undefined } = {};

function setupMenus() {
    // chrome.contextMenus.create({
    //     title: "Toggle Summarize",
    //     id: 'toggle-summarize',
    //     contexts: ['page_action']
    // });

    // chrome.contextMenus.onClicked.addListener(function (itemData) {
    //     console.log(`NDEBUG1: contextMenus.onClicked CALLED!`);
    //     if (itemData.menuItemId === "toggle-summarize") {
    //         sendToggleSummaryMessage();
    //     }
    // });

    // This is used by the Chrome extension keyboard shortcut cmd+shift+s
    chrome.commands.onCommand.addListener(function (command) {
        sendToggleSummaryMessage();
    });

    chrome.runtime.onMessage.addListener(async msg => {
        if (msg.command === 'toggle-summarize') {
            sendToggleSummaryMessage(msg.openerTabId);
        }
        else if (msg.command === Commands.KillStickies) {
            const articleTabId = msg.openerTabId || (await queryCurrentTab()).id;
            chrome.tabs.sendMessage(
                articleTabId,
                { command: Commands.KillStickies },
                r => console.log(`background.ts sent kill-sticky cmd to content-script`)
            );
        }
    });
}

function sendToggleSummaryMessage(openerTabId?) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // If openerTabId exists it means this has been initiated by a popup window opened in its
        // own tab, and therefore we must use the "tab that opened the popup window"'s tabId
        const articleTabId = openerTabId || tabs[0].id;
        if (articleTabId) {
            if (tabsInSummaryMode[articleTabId]) {
                chrome.tabs.update(articleTabId, { url: tabsInSummaryMode[articleTabId] });
                delete tabsInSummaryMode[articleTabId];
            } else {
                console.log(`background.ts sendMessage ToggleSummarize to articleTabId`, articleTabId);
                chrome.tabs.sendMessage(articleTabId, { command: Commands.ToggleSummarize }, r => {
                    // If a user is togglingSummary button when the summary is displayed, r.data will be sent from display.ts and empty
                    if (r) {
                        const payload: InputPayload = r.data;
                        tabsInSummaryMode[articleTabId] = payload.url;
                        createDisplayTab(payload);
                        // attachWorker(payload);
                    }
                });
            }
        }
    });
}

let onUpdatedListenerCount = 0; // debug

function createDisplayTab(payload: InputPayload) {
    const url = chrome.extension.getURL("summary.html");
    chrome.tabs.update({ url: url }, (currentTab: chrome.tabs.Tab) => {
        console.log(`onUpdate.addListener count ${++onUpdatedListenerCount}`);
        chrome.tabs.onUpdated.addListener(onUpdatedListener);
        function onUpdatedListener(tabId: number, info) {
            // Call worker iff:
            //  1. This is the currently active tab
            //  2. The display tab is done initializing
            //  3. Display tab is in display mode and not reverting to original url i.e. activeTabs[currentTab.id] is set
            if (currentTab.id === tabId && info.status === 'complete' && tabsInSummaryMode[currentTab.id]) {
                console.log(`onUpdated for current active tab hit: tabId=${tabId} info=${info.status}: calling Worker..`);
                // chrome.tabs.query()
                const currentTabId = currentTab.id;
                const worker = new Worker(chrome.runtime.getURL('build/summarize_worker.bundle.js'));
                worker.onmessage = e => {
                    const workerPayload: WorkerPayload = e.data;
                    const wpCommand: WorkerPayloadCommand = {
                        command: Commands.Display,
                        payload: workerPayload
                    };
                    // worker.terminate();
                    console.log(`chrome.tabs.sendMessage summaryPayload to tabId=${currentTabId}`);
                    chrome.tabs.sendMessage(currentTabId, wpCommand);
                    // chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                };

                const ipCommand: InputPayloadCommand = {
                    command: Commands.ToggleSummarize,
                    payload: payload
                };
                worker.postMessage(ipCommand);

            } // Remove the listener when transitioned from Summary Display View --> Original Page View
            else if (currentTab.id === tabId && info.status === 'complete' && !tabsInSummaryMode[currentTab.id]) {
                chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                onUpdatedListenerCount--;
            }
        };
    });
}

setupMenus();
