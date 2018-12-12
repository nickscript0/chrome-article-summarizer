import { Commands, queryCurrentTab, PortName } from './messages';

async function main() {
    const port = chrome.runtime.connect({ name: PortName.popup });

    const summarizeButton = document.getElementById('summarize-button');
    summarizeButton && summarizeButton.addEventListener("click", buildClickHandler(port, Commands.PopupToggleSummarize));

    const killStickyButton = document.getElementById('kill-sticky-button');
    killStickyButton && killStickyButton.addEventListener("click", buildClickHandler(port, Commands.PopupKillStickies));
}

function buildClickHandler(port, command) {
    return async ev => {
        const currentTab = await queryCurrentTab();
        const articleTabId = currentTab.id;
        port.postMessage({ command, articleTabId });
    };
}
main();
