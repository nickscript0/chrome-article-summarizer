// Displays the summarized text in a fresh page

import { h, createProjector } from 'maquette';
import { SummaryData, Sentence, WorkerPayload } from './messages';
import { createChart, createProfilingChart } from './display-charts';

function setupListeners() {
    chrome.runtime.onMessage.addListener(onMessageListener);
    LoadingAnimation.start();

    function onMessageListener(request, sender, sendResponse) {
        const workerPayload: WorkerPayload = request.payload;
        console.log(`Total processing time before Display : ${getTimeDiffMs(workerPayload.startTime)}ms`);
        display(workerPayload.payload, workerPayload.startTime);
        console.log(`Total processing time after Display : ${getTimeDiffMs(workerPayload.startTime)}ms`);
        chrome.runtime.onMessage.removeListener(onMessageListener);
    };
}

class LoadingAnimation {
    static start() {
        LoadingAnimation.updateLoadingCounter();
    }

    static stop() {
        const loadingClock = document.getElementById('loading-clock');
        if (loadingClock) loadingClock.style.display = 'none';
        // TODO: come up with more elegant way to disable the loadingCount
        const loadingCounter = document.getElementById('loading-counter');
        if (loadingCounter) loadingCounter.textContent = '';
    }

    private static updateLoadingCounter() {
        // console.log(`updateLoadingCounter!`);
        const counterEl = document.getElementById('loading-counter');
        const loadingClock = document.getElementById('loading-clock');
        // Stop updating if loadingClock's display is set to none
        if (!counterEl || !loadingClock || loadingClock.style.display === 'none') return;
        const value = counterEl.textContent ? (parseFloat(counterEl.textContent) + .01).toFixed(2) : 0;
        counterEl.textContent = value.toString() + 's';
        setTimeout(LoadingAnimation.updateLoadingCounter, 10);
    }
}

function getTimeDiffMs(startTime: number): string {
    const now = Date.now();
    const diff = (now - startTime).toFixed(0);
    return diff;
}

interface State {
    showDetails: boolean;
    queuedScrollIntoView: boolean;
}

function display(data, startTime) {
    document.title = data.title + ' - Summary';
    LoadingAnimation.stop();

    // Remove any previous state (i.e. cases where the extension page is refreshed)
    // TODO: this no longer seems necessary after testing, can it be removed?
    const oldRoot = document.getElementById('root-div');
    oldRoot && oldRoot.remove();


    const state: State = { showDetails: false, queuedScrollIntoView: false };
    const projector = createProjector();
    document.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'd') {
            _showDetailsEvent(state);
            projector.scheduleRender();
        }
    }, false);
    projector.append(document.body, buildRender(state, data, startTime));
}

function _showDetailsEvent(state: State) {
    state.showDetails = !state.showDetails;
    if (state.showDetails) state.queuedScrollIntoView = true;
}

function buildRender(state: State, data: SummaryData, startTime: number) {
    const toggleChartButton = h('a',
        { href: 'javascript:void(0);', onclick: () => { _showDetailsEvent(state); } },
        ['Toggle Details']
    );

    // Add Details Section
    const total: number = data.timing.reduce((n, el) => n + el.value, 0);
    const generatedTimeText = `Summarized in ${total.toFixed(1)} ms`;
    const detailsText = h('pre.stats-text', [[data.textStats, data.wordStats, generatedTimeText].join('\n')]);

    // Add Charts Section
    const profilingChart = _createChartH(createProfilingChart(data.timing, 'Complete Timings'));
    const profilingNlpChart = _createChartH(createProfilingChart(data.nlpTiming, 'Nlp Get Sentences Timings'));
    const rankChart = _createChartH(createChart(data.pageRanks, data.numSummarySentences));


    return () => {
        const detailsSection = h('div#details',
            {
                style: `display: ${state.showDetails ? '' : 'none'}`,
                afterUpdate: (el: Element) => {
                    if (state.queuedScrollIntoView) setTimeout(() =>
                        el.scrollIntoView({ 'behavior': 'smooth', 'block': 'start' }), 50);
                }
            },
            [
                detailsText,
                rankChart,
                profilingChart,
                profilingNlpChart
            ]
        );

        const rootDiv = h('div.page#root-div', [
            h('h2', [data.title]),
            data.sentences
                .filter(s => s.rank < data.numSummarySentences)
                .map(s => _createParagraphH(s, false)),
            h('br'),
            toggleChartButton,
            detailsSection
        ]);
        return rootDiv;
    };
}

function _createChartH(chartFunc) {
    return h('div', { style: `width: 100%; height: 100%; textAlign: center;` },
        [h('canvas', { afterCreate: chartFunc })]
    );
}

function _createParagraphH(text: Sentence, bold = false) {
    const boldH = bold ? '.bold' : '';
    return h('div.paragraph', [
        h(`div.p-content${boldH}`, [text.content]),
        h('div.p-rank', [`[Rank: ${text.rank}]`])
    ]);
}

setupListeners();