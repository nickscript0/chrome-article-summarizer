// Displays the summarized text in a fresh page

import { h, createProjector, Projector } from 'maquette';
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

class State {
    showDetails: boolean;
    queuedScrollIntoView: boolean;
    _showNumSentences: number;
    totalSentences: number;
    orderByRank: boolean;

    constructor(showDetails, queuedScrollIntoView, showNumSentences, totalSentences) {
        this.showDetails = showDetails;
        this.queuedScrollIntoView = queuedScrollIntoView;
        this._showNumSentences = (showNumSentences < totalSentences) ? showNumSentences : totalSentences;
        this.totalSentences = totalSentences;
        this.orderByRank = false;
    }

    increaseSentences() {
        if (this._showNumSentences < this.totalSentences) this._showNumSentences++;
    }

    decreaseSentences() {
        if (this._showNumSentences > 1) this._showNumSentences--;
    }

    get showNumSentences() {
        return this._showNumSentences;
    }

    toggleOrderByRank() {
        this.orderByRank = !this.orderByRank;
    }
}

function display(data: SummaryData, startTime: number) {
    document.title = data.title + ' - Summary';
    LoadingAnimation.stop();

    // Remove any previous state (i.e. cases where the extension page is refreshed)
    // TODO: this no longer seems necessary after testing, can it be removed?
    const oldRoot = document.getElementById('root-div');
    oldRoot && oldRoot.remove();


    const state: State = new State(false, false, data.numSummarySentences, data.sentences.length);
    const projector = createProjector();
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'd') {
            _showDetailsEvent(state);
            projector.scheduleRender();
        } else if (e.key === 'r') {
            flipOrderByRankSwitch(state, projector);
        } else if (e.key === 'ArrowLeft') {
            state.decreaseSentences();
            projector.scheduleRender();
        } else if (e.key === 'ArrowRight') {
            state.increaseSentences();
            projector.scheduleRender();
        }
    }, false);
    projector.append(document.body, buildRender(state, data, startTime));
}

function flipOrderByRankSwitch(state: State, projector: Projector | undefined) {
    state.toggleOrderByRank();
    const orSwitch = document.getElementById('order-rank-switch');
    if (orSwitch) (orSwitch as any).checked = state.orderByRank;
    if (projector) projector.scheduleRender();
}

function _showDetailsEvent(state: State) {
    state.showDetails = !state.showDetails;
    if (state.showDetails) state.queuedScrollIntoView = true;
}

function buildRender(state: State, data: SummaryData, startTime: number) {
    const toggleChartButton = h('a.toggle-details',
        { href: '#', onclick: () => { _showDetailsEvent(state); } },
        ['Toggle Stats']
    );

    // Add Details Section
    const total: number = data.timing.reduce((n, el) => n + el.value, 0);
    const generatedTimeText = `Summarized in ${total.toFixed(1)} ms`;
    const detailsText = h('pre.stats-text', [[data.textStats, data.wordStats, generatedTimeText].join('\n')]);

    // Add Charts Section
    const profilingChart = _createSmallChartH(createProfilingChart(data.timing, 'Complete Timings'));
    const profilingNlpChart = _createSmallChartH(createProfilingChart(data.nlpTiming, 'Nlp Get Sentences Timings'));
    const rankChart = _createChartH(createChart(data.pageRanks, data.numSummarySentences));

    // Sentence order control
    const sentenceOrderSwitch = h('div.onoffswitch', [
        h(
            'input.onoffswitch-checkbox#order-rank-switch',
            {
                type: 'checkbox', name: 'onoffswitch', checked: false, onchange: e => {
                    console.log(`switch onchange`);
                    state.toggleOrderByRank();
                }
            }
        ),
        h('label.onoffswitch-label', { for: 'order-rank-switch' }, [
            h('span.onoffswitch-inner'),
            h('span.onoffswitch-switch')
        ])
    ]);
    const sentenceOrderControl = h(
        'div.sentence-order-control',
        [
            sentenceOrderSwitch,
            h('span', { onclick: e => flipOrderByRankSwitch(state, undefined) }, ['Order by rank'])
        ]
    );

    const rankOrderedSentences = data.sentences.slice(0)
        .sort((a, b) => a.rank - b.rank);

    return () => {
        const numSentenceButtons = h('div.sentence-buttons', [
            // <a href="something" class="button6">Ok</a>
            h('a.icono-arrow2-left', { href: '#', onclick: e => { state.decreaseSentences(); } }, ['']),

            h('div', { style: 'display: inline-block; font-size: 10px; padding-right: 5px; padding-left: 5px;' },
                [
                    h('span', [`Sentences: `]),
                    h('span', { style: 'display: inline-block; width: 30px;' }, [`${state._showNumSentences}/${state.totalSentences}`])
                ]
            ),
            h('a.icono-arrow2-right', { href: '#', onclick: e => { state.increaseSentences(); } }, ['']),

        ]);

        const detailsSection = h('div#details',
            {
                style: `display: ${state.showDetails ? '' : 'none'}`,
                afterUpdate: (el: Element) => {
                    if (state.queuedScrollIntoView) setTimeout(() => {
                        state.queuedScrollIntoView = false;
                        el.scrollIntoView({ 'behavior': 'smooth', 'block': 'start' });
                    }, 50);
                }
            },
            [
                h('h3', ['Page Stats']),
                detailsText,
                rankChart,
                h('div.profile-charts', [profilingChart, profilingNlpChart])

            ]
        );

        const separator = key =>
            h('div.separator', { key, style: 'display: inline-block; padding-left: 8px; padding-right: 8px;' }, ['']);

        const sentences = (state.orderByRank) ? rankOrderedSentences : data.sentences;
        const rootDiv = h('div.page#root-div', [
            h('h2', [data.title]),
            sentences
                .filter(s => s.rank < (state._showNumSentences + 1))
                .map(s => _createParagraphH(s, false)),
            h('br'),
            h('div.footer', [
                numSentenceButtons,
                separator(1),
                toggleChartButton,
                separator(2),
                sentenceOrderControl
            ]),

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

function _createSmallChartH(chartFunc) {
    return h('div.small-chart',
        [h('canvas', { afterCreate: chartFunc })]
    );
}

function _createParagraphH(text: Sentence, bold = false) {
    const boldH = bold ? '.bold' : '';
    return h('div.paragraph', { key: text.rank }, [
        h(`div.p-content${boldH}`, [text.content]),
        h('div.p-rank', [`[Rank: ${text.rank}]`])
    ]);
}

setupListeners();