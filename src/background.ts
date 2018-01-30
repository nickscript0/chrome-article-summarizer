import { Commands, SummaryData } from './messages';

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
        if (mainTabId !== undefined) chrome.tabs.sendMessage(mainTabId, { command: Commands.Summarize }, response => {
            attachWorker(response.data);
            createDisplayTab();
        });
    });
}

function createDisplayTab() {
    const url = chrome.extension.getURL("summary.html");
    chrome.tabs.create({ url: url, selected: true }, (tab) => {
        // if (tab.id) {
        //     chrome.tabs.sendMessage(tab.id, { command: Commands.Display, data: data });
        // } else {
        //     console.log(`Error: summary.html tab.id is undefined, cannot display summary`);
        // }
    });
}

function attachWorker(payload) {
    const worker = new SharedWorker(chrome.runtime.getURL('build/summarize_worker.bundle.js'));
    // const worker = new SharedWorker(chrome.runtime.getURL('build/shared-worker-test.js'));
    // const worker = new Worker(chrome.runtime.getURL('build/summarize_worker.bundle.js'));

    console.log(`Called new SharedWorker`);

    worker.port.start(); // TODO: is this necessary?

    worker.port.addEventListener('message', function (e) {
        console.log(`Received ANY msg from worker`);
        if (e.data.type === Commands.DisplayTabReady) {
            console.log(`Received DisplayTabReady command from Worker!`);

            worker.port.postMessage({
                type: Commands.Summarize,
                payload: payload
            });
        }
    });

    console.log(`SharedWorker.port.start()`);

    console.log(`SharedWorker.port.postMessage()`);
}


setupMenus();
