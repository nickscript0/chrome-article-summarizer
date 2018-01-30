import { Commands } from './messages';
import { summarizeTextBlocks } from './summarize';
declare let onconnect;

// modeled off of https://gist.github.com/pierophp/898f8316afa1bd04e04853bc3e3cfb48
let connections = 0; // count active connections
let displayPort;
let summarizePort;
onconnect = e => {
    const port = e.ports[0];
    connections += 1;
    if (connections === 1) summarizePort = port;
    if (connections === 2) displayPort = port;
    console.log(`summarize-worker connections: ${connections}`);
    port.start();
    port.onmessage = event => {
        console.log(`Worker received port.onmessage ${event.data.type}`);
        if (event.data.type === Commands.DisplayTabReady) {
            summarizePort && summarizePort.postMessage({ type: Commands.DisplayTabReady });
        }
        else if (event.data.type === Commands.Summarize) {
            const textBlocks = event.data.payload.textBlocks;
            const pageTitle = event.data.payload.title;
            const summaryData = summarizeTextBlocks(textBlocks, pageTitle);
            displayPort && displayPort.postMessage({
                type: Commands.Display,
                payload: summaryData,
                startTime: event.data.payload.startTime
            });
            // This is necessary otherwise connections goes to 2, 3 the next article that is summarized
            // TODO: investigate if closing the working, and opening it each summarize
            close();
        }
    };
};