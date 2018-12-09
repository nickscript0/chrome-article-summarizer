import { Commands, InputPayload, WorkerPayload, WorkerPayloadCommand, InputPayloadCommand } from './messages';

// key: tab.id, value: url string or null if not in summary mode
let activeTabs: { [tabid: number]: string | undefined } = {};

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
        console.log(`NDEBUG2: onCommand CALLED!`);
        sendToggleSummaryMessage();
    });

    // chrome.browserAction.onClicked.addListener(function () {
    //     console.log(`NDEBUG3: browserAction.onClicked CALLED!`);
    //     sendToggleSummaryMessage();
    // });

    chrome.runtime.onMessage.addListener(msg => {
        if (msg.command === 'toggle-summarize') {
            sendToggleSummaryMessage();
        }
        if (msg.command === Commands.KillStickies) {
            // console.log(`kill-sticky called background`);
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const mainTabId = tabs[0].id;
                if (mainTabId) {
                    chrome.tabs.sendMessage(mainTabId, { command: Commands.KillStickies },
                        r => { console.log(`background sent kill-sticky to content-script`); });
                }
            });
        }
    });
}

function sendToggleSummaryMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const mainTabId = tabs[0].id;
        if (mainTabId) {
            if (activeTabs[mainTabId]) {
                chrome.tabs.update(mainTabId, { url: activeTabs[mainTabId] });
                delete activeTabs[mainTabId];
            } else {
                chrome.tabs.sendMessage(mainTabId, { command: Commands.ToggleSummarize }, r => {
                    // If a user is togglingSummary button when the summary is displayed, r.data will be sent from display.ts and empty
                    if (r) {
                        const payload: InputPayload = r.data;
                        activeTabs[mainTabId] = payload.url;
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
            if (currentTab.id === tabId && info.status === 'complete' && activeTabs[currentTab.id]) {
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
            else if (currentTab.id === tabId && info.status === 'complete' && !activeTabs[currentTab.id]) {
                chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                onUpdatedListenerCount--;
            }
        };
    });
}

setupMenus();
