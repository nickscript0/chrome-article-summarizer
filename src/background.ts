import { Commands, InputPayload, WorkerPayload, SimpleCommand, WorkerPayloadCommand, InputPayloadCommand } from './messages';

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
            createDisplayTab();
            attachWorker(payload);
        });
    });
}

function createDisplayTab() {
    const url = chrome.extension.getURL("summary.html");
    chrome.tabs.update({ url: url });
}

function attachWorker(payload: InputPayload) {
    // runtime.connect: Background <-> DisplayTab
    chrome.runtime.onConnect.addListener(onConnectListener);
    function onConnectListener(displayTabPort) {
        console.log(`runtime.onConnect: ${payload.url}`);

        const worker = new Worker(chrome.runtime.getURL('build/summarize_worker.bundle.js'));
        worker.onmessage = e => {
            const workerPayload: WorkerPayload = e.data;
            const wpCommand: WorkerPayloadCommand = {
                command: Commands.Display,
                payload: workerPayload
            };
            // worker.terminate();
            console.log(`Sending message to displayTabPort: ${wpCommand.payload.url}`);
            displayTabPort.postMessage(wpCommand);
            chrome.runtime.onConnect.removeListener(onConnectListener);
            displayTabPort.disconnect();
        };

        const ipCommand: InputPayloadCommand = {
            command: Commands.ToggleSummarize,
            payload: payload
        };
        worker.postMessage(ipCommand);
    }
}

setupMenus();
