import {
    Commands, InputPayload, WorkerPayload,
    WorkerPayloadCommand, InputPayloadCommand, PortName, KeyboardCommands
} from './messages';

// key: tab.id, value: url string or null if not in summary mode
let tabsInSummaryMode: { [tabid: number]: string | undefined } = {};
let lastTabId, currentTabId;

function closeTab(tabId) {
    log(`chrome.tabs.remove(${tabId})`);
    chrome.tabs.remove(tabId);
}

function setupListeners() {
    /**
     * Listen for popup port connect and handle popup commands
     */
    chrome.runtime.onConnect.addListener((port) => {
        log(`runtime.onConnect port ${port.name}`);
        if (port.name === PortName.popup) {
            port.onMessage.addListener(async (msg: any) => {
                log(`onMessage msg.command=${msg.command}`);

                if (msg.command === Commands.PopupToggleSummarize) {
                    if (msg.articleTabId !== currentTabId) closeTab(currentTabId);
                    sendToggleSummaryMessageToContentScript(msg.articleTabId);
                }
                else if (msg.command === Commands.PopupKillStickies) {
                    // const articleTabId = msg.openerTabId || (await queryCurrentTab()).id;
                    log(`msg.articleTabId=${msg.articleTabId}, lastTabId=${lastTabId}`);
                    if (msg.articleTabId !== currentTabId) closeTab(currentTabId);
                    sendKillStickyMessageToContentScript(msg.articleTabId);
                }
            });
        }
    });

    /**
     * Track the current and last focused tabs
     */
    chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
        log(`tabs.onUpdated tabId=${tabId} windowId=${windowId}`);
        lastTabId = currentTabId;
        currentTabId = tabId;
    });

    /**
     * Listen for Browser extension keyboard shortcuts
     * e.g. Cmd+Shift+S
     *
     * Note: Firefox for Android does not have chrome.commands defined, so checks this
     */
    chrome.commands.onCommand.addListener(command => {
        if (command === KeyboardCommands.ToggleSummarize) sendToggleSummaryMessageToContentScript();
        else if (command === KeyboardCommands.TriggerKillStickies) sendKillStickyMessageToContentScript(currentTabId);
        else log(`unnkown keyboard command, doing nothing:`, command);
    });


}

function sendKillStickyMessageToContentScript(tabId) {
    chrome.tabs.sendMessage(
        tabId,
        { command: Commands.PopupKillStickies },
        r => log(`sent kill-sticky cmd to content-script`)
    );
}

function sendToggleSummaryMessageToContentScript(articleTabId?) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) { // TODO: highlighted: true
        articleTabId = articleTabId || tabs[0].id; // TODO: change this to || currentTabId and remove the query
        log(`sendToggleSummaryMessageToContentScript tabs.query:`, tabs);
        log(`sendToggleSummaryMessageToContentScript I think the articleTabId is:`, articleTabId);
        if (articleTabId) {
            if (tabsInSummaryMode[articleTabId]) {
                chrome.tabs.update(articleTabId, { url: tabsInSummaryMode[articleTabId] });
                delete tabsInSummaryMode[articleTabId];
            } else {
                log(`sendMessage ToggleSummarize to articleTabId`, articleTabId);
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
        log(`onUpdate.addListener count ${++onUpdatedListenerCount}`);
        chrome.tabs.onUpdated.addListener(onUpdatedListener);
        function onUpdatedListener(tabId: number, info) {
            // Call worker iff:
            //  1. This is the currently active tab
            //  2. The display tab is done initializing
            //  3. Display tab is in display mode and not reverting to original url i.e. activeTabs[currentTab.id] is set
            if (currentTab.id === tabId && info.status === 'complete' && tabsInSummaryMode[currentTab.id]) {
                log(`onUpdated for current active tab hit: tabId=${tabId} info=${info.status}: calling Worker..`);
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
                    log(`chrome.tabs.sendMessage summaryPayload to tabId=${currentTabId}`);
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

function log(...args) {
    console.log(`background.ts:`, ...args);
}

setupListeners();
