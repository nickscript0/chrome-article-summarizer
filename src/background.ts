import { Commands, InputPayload, WorkerPayload, WorkerPayloadCommand, InputPayloadCommand } from './messages';

function setupMenus() {
    chrome.contextMenus.create({
        title: "Toggle Summarize",
        id: 'toggle-summarize',
        contexts: ['page_action']
    });

    chrome.contextMenus.onClicked.addListener(function (itemData) {
        if (itemData.menuItemId === "toggle-summarize") {
            sendToggleSummaryMessage();
        }
    });

    chrome.commands.onCommand.addListener(function (command) {
        sendToggleSummaryMessage();
    });

    chrome.browserAction.onClicked.addListener(function () {
        sendToggleSummaryMessage();
    });
}

function sendToggleSummaryMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const mainTabId = tabs[0].id;
        if (mainTabId !== undefined) chrome.tabs.sendMessage(mainTabId, { command: Commands.ToggleSummarize }, r => {
            const payload: InputPayload = r.data;
            createDisplayTab(payload);
            // attachWorker(payload);
        });
    });
}

function createDisplayTab(payload: InputPayload) {
    const url = chrome.extension.getURL("summary.html");
    chrome.tabs.update({ url: url }, (currentTab: chrome.tabs.Tab) => {
        chrome.tabs.onUpdated.addListener(onUpdatedListener);
        function onUpdatedListener(tabId: number, info) {
            console.log(`onUpdated hit: tabId=${tabId} info=${info.status}`);
            if (currentTab.id === tabId && info.status === 'complete') {
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
                    chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                };

                const ipCommand: InputPayloadCommand = {
                    command: Commands.ToggleSummarize,
                    payload: payload
                };
                worker.postMessage(ipCommand);

            }
        };
    });
}

setupMenus();
