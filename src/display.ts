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

// function display(data: SummaryData, startTime: number) {
//     document.title = data.title + ' - Summary';

//     // Remove any previous state (i.e. cases where the extension page is refreshed)
//     const oldRoot = document.getElementById('root-div');
//     oldRoot && oldRoot.remove();

//     const rootDiv = document.createElement('div');
//     rootDiv.className = 'page';
//     rootDiv.id = 'root-div';

//     const title = document.createElement('h2');
//     title.textContent = data.title;
//     rootDiv.appendChild(title);

//     for (const text of data.sentences) {
//         // TODO: Remove this if later, for now though articles are too hard to read with whole text shown
//         if (text.rank < data.numSummarySentences) {
//             // let p = _createParagraph(text, text.rank < data.numSummarySentences);
//             let p = _createParagraph(text, false);
//             rootDiv.appendChild(p);
//         }
//     }

//     // Add toggle button for showing the chart
//     const toggleChartButton = document.createElement('a');
//     toggleChartButton.text = 'Toggle Details';
//     toggleChartButton.href = 'javascript:void(0);';
//     // yourUl.style.display = yourUl.style.display === 'none' ? '' : 'none';
//     // document.addEventListener("keypress", handle_keypress(nav, highlighter), false);
//     function toggleDetailsView(scroll = false) {
//         const detailsEl = document.getElementById('details');
//         if (detailsEl) {
//             if (detailsEl.style.display === 'none') {
//                 detailsEl.style.display = '';
//                 if (scroll) setTimeout(() =>
//                     detailsEl.scrollIntoView({ 'behavior': 'smooth', 'block': 'start' }), 50);
//             } else {
//                 detailsEl.style.display = 'none';
//             }
//         }
//     };
//     toggleChartButton.onclick = () => toggleDetailsView();
//     document.addEventListener('keypress', (e: KeyboardEvent) => {
//         if (e.key === 'd') toggleDetailsView(true);
//     }, false);

//     rootDiv.appendChild(document.createElement('br'));
//     rootDiv.appendChild(toggleChartButton);

//     // Add details div with stats text and chart
//     const details = document.createElement('div');
//     details.id = 'details';
//     details.style.display = 'none';
//     const pre = document.createElement('pre');
//     // const detailedTimeText = `${data.timing.map(t => t.name + '=' + t.value + 'ms').join(', ')}`;
//     const total: number = data.timing.reduce((n, el) => n + el.value, 0);
//     const generatedTimeText = `Summarized in ${total.toFixed(1)} ms`;
//     pre.textContent = [data.textStats, data.wordStats, generatedTimeText].join('\n');
//     pre.className = 'stats-text';
//     details.appendChild(pre);

//     const profilingChart = _createProfilingChart(data.timing, 'Complete Timings');
//     const profilingNlbChart = _createProfilingChart(data.nlpTiming, 'Nlp Get Sentences Timings');
//     if (profilingChart) details.appendChild(profilingChart);
//     if (profilingNlbChart) details.appendChild(profilingNlbChart);

//     const chart = _createChart(data.pageRanks, data.numSummarySentences);
//     if (chart) details.appendChild(chart);
//     rootDiv.appendChild(details);

//     LoadingAnimation.stop();

//     document.body.appendChild(rootDiv);

// }

function display2(data, startTime) {
    document.title = data.title + ' - Summary';

    const projector = createProjector();
    LoadingAnimation.stop();
    projector.append(document.body, buildRender(data, startTime));
}

function buildRender(data: SummaryData, startTime: number) {
    return () => {
        // Remove any previous state (i.e. cases where the extension page is refreshed)
        const oldRoot = document.getElementById('root-div');
        oldRoot && oldRoot.remove();

        // TODO 1: CHART
        // // Add toggle button for showing the chart
        // const toggleChartButton = document.createElement('a');
        // toggleChartButton.text = 'Toggle Details';
        // toggleChartButton.href = 'javascript:void(0);';
        // // yourUl.style.display = yourUl.style.display === 'none' ? '' : 'none';
        // // document.addEventListener("keypress", handle_keypress(nav, highlighter), false);
        // function toggleDetailsView(scroll = false) {
        //     const detailsEl = document.getElementById('details');
        //     if (detailsEl) {
        //         if (detailsEl.style.display === 'none') {
        //             detailsEl.style.display = '';
        //             if (scroll) setTimeout(() =>
        //                 detailsEl.scrollIntoView({ 'behavior': 'smooth', 'block': 'start' }), 50);
        //         } else {
        //             detailsEl.style.display = 'none';
        //         }
        //     }
        // };
        // toggleChartButton.onclick = () => toggleDetailsView();
        // document.addEventListener('keypress', (e: KeyboardEvent) => {
        //     if (e.key === 'd') toggleDetailsView(true);
        // }, false);

        // rootDiv.appendChild(document.createElement('br'));
        // rootDiv.appendChild(toggleChartButton);


        // TODO 2: DETAILS
        // Add details div with stats text and chart
        const total: number = data.timing.reduce((n, el) => n + el.value, 0);
        const generatedTimeText = `Summarized in ${total.toFixed(1)} ms`;
        const details = h('div#details', { display: 'none' }, [
            h('pre.stats-text', [[data.textStats, data.wordStats, generatedTimeText].join('\n')])
        ]);

        // TODO3: profiling chart
        // const profilingChart = _createProfilingChart(data.timing, 'Complete Timings');
        // const profilingNlbChart = _createProfilingChart(data.nlpTiming, 'Nlp Get Sentences Timings');
        // if (profilingChart) details.appendChild(profilingChart);
        // if (profilingNlbChart) details.appendChild(profilingNlbChart);

        // const chart = _createChart(data.pageRanks, data.numSummarySentences);
        // if (chart) details.appendChild(chart);
        // rootDiv.appendChild(details);

        // document.body.appendChild(rootDiv);

        const rootDiv = h('div.page#root-div', [
            h('h2', [data.title]),
            data.sentences
                .filter(s => s.rank < data.numSummarySentences)
                .map(s => _createParagraphH(s, false)),
            details
        ]);
        return rootDiv;
    };
}

function _createParagraphH(text: Sentence, bold = false) {
    const boldH = bold ? '.bold' : '';
    return h('div.paragraph', [
        h(`div.p-content${boldH}`, [text.content]),
        h('div.p-rank', [`[Rank: ${text.rank}]`])
    ]);
}

function _createChart(prArr: Array<number>, num_summary_sentences: number) {
    // <canvas id="myChart" width="400" height="400"></canvas>
    // <script>
    // var ctx = document.getElementById("myChart").getContext('2d');
    const canvasEl = document.createElement('canvas');
    // canvasEl.width = 200;
    // canvasEl.height = 200;
    // canvasEl.style.width = '400px';
    // canvasEl.style.height = '400px';
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

    const div = document.createElement('div');
    // div.style.width = '800px';
    // div.style.height = '400px';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.textAlign = 'center';
    div.appendChild(canvasEl);
    return div;
}

function _createProfilingChart(timings: Timings, title: string) {
    const canvasEl = document.createElement('canvas');
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

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.textAlign = 'center';
    div.appendChild(canvasEl);
    return div;
}

setupListeners();