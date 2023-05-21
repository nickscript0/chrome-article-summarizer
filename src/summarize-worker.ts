import {
    Commands,
    InputPayload,
    WorkerPayload,
    InputPayloadCommand
} from './messages';
import { summarizeTextBlocks } from './summarize';

onmessage = function(event) {
    const ipCommand: InputPayloadCommand = event.data;
    if (ipCommand.command === Commands.ToggleSummarize) {
        const payload: InputPayload = ipCommand.payload;
        const textBlocks = payload.textBlocks;
        const pageTitle = payload.title;
        const summaryData = summarizeTextBlocks(
            textBlocks,
            pageTitle,
            payload.readabilityText
        );
        summaryData.timing = summaryData.timing.concat(payload.timings);

        const workerPayload: WorkerPayload = {
            type: Commands.Display,
            payload: summaryData,
            startTime: payload.startTime,
            url: payload.url
        };
        postMessage(workerPayload);
    }
};
