// Displays the summarized text in a fresh page

import { Chart } from "chart.js";
import { h, createProjector } from 'maquette';
import { SummaryData, Sentence, WorkerPayload, Timings } from './messages';

function setupListeners() {
    chrome.runtime.onMessage.addListener(onMessageListener);
    LoadingAnimation.start();

    function onMessageListener(request, sender, sendResponse) {
        const workerPayload: WorkerPayload = request.payload;
        console.log(`Total processing time before Display : ${getTimeDiffMs(workerPayload.startTime)}ms`);
        display2(workerPayload.payload, workerPayload.startTime);
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

function display2(data, startTime) {
    document.title = data.title + ' - Summary';

    const projector = createProjector();
    LoadingAnimation.stop();

    const state: State = { showDetails: false, queuedScrollIntoView: false };

    // TODO: is this still necessary? Is it working after move to maquette.js?
    const oldRoot = document.getElementById('root-div');
    oldRoot && oldRoot.remove();



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

    return () => {
        // Add Details Section
        const total: number = data.timing.reduce((n, el) => n + el.value, 0);
        const generatedTimeText = `Summarized in ${total.toFixed(1)} ms`;
        const detailsText = h('pre.stats-text', [[data.textStats, data.wordStats, generatedTimeText].join('\n')]);

        // Add Charts Section
        const profilingChart = _createChartH(_createProfilingChart(data.timing, 'Complete Timings'));
        const profilingNlpChart = _createChartH(_createProfilingChart(data.nlpTiming, 'Nlp Get Sentences Timings'));
        const rankChart = _createChartH(_createChart(data.pageRanks, data.numSummarySentences));
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

function _createChart(prArr: Array<number>, num_summary_sentences: number) {
    return (canvasEl: HTMLCanvasElement) => {
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;
        const barChartData = {
            labels: Array.from(Array(prArr.length).keys()).map(x => x.toString()),
            datasets: [{
                label: 'Page Rank Values',
                // backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
                // borderColor: window.chartColors.red,
                borderWidth: 1,
                data: prArr,
                backgroundColor: Array(num_summary_sentences).fill('rgba(75, 192, 192, 0.2)'),
                borderColor: Array(num_summary_sentences).fill('rgba(75, 192, 192, 1)')
            }]
        };
        new Chart(ctx, {
            type: 'bar',
            data: barChartData,
            options: {
                // maintainAspectRatio: false,
                // responsive: false
            }
        });
    };
}

function _createProfilingChart(timings: Timings, title: string) {
    return (canvasEl: HTMLCanvasElement) => {
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: timings.map(t => t.name), //["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
                datasets: [{
                    label: 'Processing time (ms)',
                    data: timings.map(t => t.value), // [12, 19, 3, 5, 2, 3],
                    backgroundColor: Array(timings.length).fill('rgba(75, 192, 192, 0.2)'),
                    borderColor: Array(timings.length).fill('rgba(75, 192, 192, 1)'),
                    borderWidth: 1
                }]
            },
            options: {
                title: {
                    text: title,
                    display: true
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Time (ms)'
                        }
                    }]
                }
            }
        });
    };
}

setupListeners();