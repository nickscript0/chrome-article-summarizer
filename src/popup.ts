console.log(`popup.ts loaded`);
import { Commands } from './messages';

function main() {
    let app;

    try {
        app = browser;
    } catch (e) {
        console.log(`Chrome detected, using 'chrome' object instead of 'browser'`);
        app = chrome;
    }

    const summarizeButton = document.getElementById('summarize-button');
    summarizeButton && summarizeButton.addEventListener("click", (ev) => {
        window.close();
        app.runtime.sendMessage({ command: "toggle-summarize" })
            .then(() => {
                console.log('Initiated toggle-summarize')
            });
    });

    const killStickyButton = document.getElementById('kill-sticky-button');
    killStickyButton && killStickyButton.addEventListener("click", (ev) => {
        window.close();
        app.runtime.sendMessage({ command: Commands.KillStickies })
            .then(() => {
                console.log(`Initiated kill-sticky-headers`);
            });
    });

}

main();