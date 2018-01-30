import { Commands } from './messages';

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
        if (mainTabId !== undefined) chrome.tabs.sendMessage(mainTabId, { command: Commands.Summarize }, r => {
            attachWorker(r.data);
            createDisplayTab();
        });
    });
}

function createDisplayTab() {
    const url = chrome.extension.getURL("summary.html");
    chrome.tabs.create({ url: url, selected: true }, (tab) => {

    });
}

function attachWorker(payload) {
    const worker = new SharedWorker(chrome.runtime.getURL('build/summarize_worker.bundle.js'));
    worker.port.start(); // TODO: is this necessary?

    worker.port.addEventListener('message', function (e) {
        if (e.data.type === Commands.DisplayTabReady) {
            worker.port.postMessage({
                type: Commands.Summarize,
                payload: payload
            });
        }
    });
}

setupMenus();
