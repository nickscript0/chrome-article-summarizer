import { Commands, PortName } from './messages';

// Note: chrome.tabs.query cannot be used in Popup, results in 
// TypeError: Argument 1 of StructuredCloneHolder.deserialize is not an object.
function main() {
    const port = chrome.runtime.connect({ name: PortName.popup });

    const summarizeButton = document.getElementById('summarize-button');
    summarizeButton && summarizeButton.addEventListener("click", () => port.postMessage({ command: Commands.PopupToggleSummarize }));

    const killStickyButton = document.getElementById('kill-sticky-button');
    killStickyButton && killStickyButton.addEventListener("click", () => port.postMessage({ command: Commands.PopupKillStickies }));
}

main();
