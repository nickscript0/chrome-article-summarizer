import {
    Commands, InputPayload, WorkerPayload,
    WorkerPayloadCommand, InputPayloadCommand, PortName, KeyboardCommands,
    queryCurrentTab
} from './messages';

// key: tab.id, value: url string or null if not in summary mode
let tabsInSummaryMode: { [tabid: number]: string | undefined } = {};
let currentTabId;

function closeTab(tabId: number | undefined) {
    log(`chrome.tabs.remove(${tabId})`);
    if (tabId) chrome.tabs.remove(tabId);
}

function setupListeners() {
    /**
     * Listen for popup port connect and handle popup commands
     */
    chrome.runtime.onConnect.addListener((port) => {
        log(`runtime.onConnect port ${port.name}`);
        if (port.name === PortName.popup) {
            port.onMessage.addListener(async (msg: any) => {
                log(`[popup port] onMessage msg.command=${msg.command}`);
                const queriedTab = await queryCurrentTab();

                if (msg.command === Commands.PopupToggleSummarize) {
                    // In Firefox Mobile queriedTab is the article tab, currentTabId is the popup tab
                    // In Firefox Desktop queriedTab and currentTabId are both the article tab
                    if (queriedTab.id !== currentTabId) closeTab(currentTabId);
                    sendToggleSummaryMessageToContentScript(msg.articleTabId);
                }
                else if (msg.command === Commands.PopupKillStickies) {
                    if (queriedTab.id !== currentTabId) closeTab(currentTabId);
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
        currentTabId = tabId;
    });

    /**
     * Listen for Browser extension keyboard shortcuts
     * e.g. Cmd+Shift+S
     *
     * Note: Firefox for Android does not have chrome.commands defined, so checks this
     */
    chrome.commands && chrome.commands.onCommand.addListener(command => {
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
    // We re-query the current highlighted tab here as the user could've changed window focus,
    // which doesn't trigger a tabs.onActivated event and therefore 'currentTabId' is out of date
    // Note: it'd be cleaner to use "await queryTabs(...)" here, but then get a Uncaught (in promise) TypeError: Cannot read property 'id' of undefined
    chrome.tabs.query({ active: true, currentWindow: true, highlighted: true }, tabs => {
        articleTabId = articleTabId || tabs[0].id;
        // log(`sendToggleSummaryMessageToContentScript tabs.query:`, tabs);
        // log(`sendToggleSummaryMessageToContentScript I think the articleTabId is:`, articleTabId);
        if (articleTabId) {
            if (tabsInSummaryMode[articleTabId]) {
                chrome.tabs.update(articleTabId, { url: tabsInSummaryMode[articleTabId] });
                delete tabsInSummaryMode[articleTabId];
            } else {
                log(`sendMessage ToggleSummarize to articleTabId`, articleTabId);
                chrome.tabs.sendMessage(articleTabId, { command: Commands.ToggleSummarize }, r => {
                    if (r) {
                        const payload: InputPayload = r.data;
                        tabsInSummaryMode[articleTabId] = payload.url;
                        createDisplayTab(payload);
                    }
                });
            }
        }
    });
}

let onUpdatedListenerCount = 0; // debug

function createDisplayTab(payload: InputPayload) {
    const url = chrome.extension.getURL("html/summary.html");
    chrome.tabs.update({ url: url }, (displayTab: chrome.tabs.Tab) => {
        log(`onUpdate.addListener count ${++onUpdatedListenerCount}`);
        chrome.tabs.onUpdated.addListener(onUpdatedListener);
        function onUpdatedListener(tabId: number, info) {
            // Call worker iff:
            //  1. This is the currently active tab
            //  2. The display tab is done initializing
            //  3. Display tab is in display mode and not reverting to original url i.e. activeTabs[currentTab.id] is set
            if (displayTab.id === tabId && info.status === 'complete' && tabsInSummaryMode[displayTab.id]) {
                log(`onUpdated for current active tab hit: tabId=${tabId} info=${info.status}: calling Worker..`);
                const displayTabId = displayTab.id;
                const worker = new Worker(chrome.runtime.getURL('dist/summarize_worker.bundle.js'));
                worker.onmessage = e => {
                    const workerPayload: WorkerPayload = e.data;
                    const wpCommand: WorkerPayloadCommand = {
                        command: Commands.Display,
                        payload: workerPayload
                    };
                    // worker.terminate();
                    log(`chrome.tabs.sendMessage summaryPayload to tabId=${displayTabId}`);
                    chrome.tabs.sendMessage(displayTabId, wpCommand);
                    // chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                };

                const ipCommand: InputPayloadCommand = {
                    command: Commands.ToggleSummarize,
                    payload: payload
                };
                worker.postMessage(ipCommand);

            } // Remove the listener when transitioned from Summary Display View --> Original Page View
            else if (displayTab.id === tabId && info.status === 'complete' && !tabsInSummaryMode[displayTab.id]) {
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
