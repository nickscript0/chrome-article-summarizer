import {Commands, SummaryData} from './messages';

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
        if (mainTabId !== undefined) chrome.tabs.sendMessage(mainTabId, { command: Commands.Summarize }, (response) => {
            createDisplayTab(response.data);
        });
    });
}

function createDisplayTab(data: SummaryData) {
    const url = chrome.extension.getURL("summary.html");
    chrome.tabs.create({ url: url, selected: true }, (tab) => {
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { command: Commands.Display, data: data });
        } else {
            console.log(`Error: summary.html tab.id is undefined, cannot display summary`);
        }
    });
}

setupMenus();
