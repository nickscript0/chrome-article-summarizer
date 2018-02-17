// Displays the summarized text in a fresh page

import { Chart } from "chart.js";
import { SummaryData, Commands, Sentence } from './messages';

function attachWorker() {
    const worker = new SharedWorker(chrome.runtime.getURL('build/summarize_worker.bundle.js'));
    worker.port.addEventListener('message', function (e) {
        if (e.data.type === Commands.Display) {
            // Add listener that loads the original page if extension is activated again (e.g. user clicks Summarize button a 2nd time)
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.command === Commands.ToggleSummarize) {
                    document.location.href = e.data.url;
                }
            });

            // TODO: THIS DOESNT WORK, because even though it changes the url, the refresh event continues and loads the current page
            // will need to use another technique such as 
            // Add a listener that loads the original page on refresh or back event
            // window.onbeforeunload = function (innerE) {
            //     console.log(`onbeforeunload event achieved!!`);
            //     document.location.href = e.data.url;
            // };

            // This doesn't work as it's a new domain
            // window.history.pushState("object or string", document.title, e.data.url);

            console.log(`Total processing time before Display : ${getTimeDiffMs(e.data.startTime)}ms`);
            display(e.data.payload, e.data.startTime);
            console.log(`Total processing time after Display : ${getTimeDiffMs(e.data.startTime)}ms`);
        }
    });

    worker.port.start();

    worker.port.postMessage({
        type: Commands.DisplayTabReady
    });
}

function getTimeDiffMs(startTime: number): string {
    const now = Date.now();
    const diff = (now - startTime).toFixed(0);
    return diff;
}

function display(data: SummaryData, startTime: number) {
    document.title = data.title + ' - Summary';
    const rootDiv = document.createElement('div');
    rootDiv.className = 'page';

    const title = document.createElement('h2');
    title.textContent = data.title;
    rootDiv.appendChild(title);

    let i = 1;
    for (const text of data.sentences) {
        let p = _createParagraph(text);
        rootDiv.appendChild(p);
        i += 1;
    }

    // Add toggle button for showing the chart
    const toggleChartButton = document.createElement('a');
    toggleChartButton.text = 'Toggle Details';
    toggleChartButton.href = '#';
    // yourUl.style.display = yourUl.style.display === 'none' ? '' : 'none';
    toggleChartButton.onclick = () => {
        const detailsEl = document.getElementById('details');
        if (detailsEl) detailsEl.style.display = detailsEl.style.display === 'none' ? '' : 'none';
    };
    rootDiv.appendChild(document.createElement('br'));
    rootDiv.appendChild(toggleChartButton);

    // Add details div with stats text and chart
    const details = document.createElement('div');
    details.id = 'details';
    details.style.display = 'none';
    const pre = document.createElement('pre');
    const generatedTimeText = `Summarized in ${getTimeDiffMs(startTime)} ms`;
    pre.textContent = [generatedTimeText, data.textStats, data.wordStats].join('\n');
    pre.className = 'stats-text';
    details.appendChild(pre);
    const chart = _createChart(data.pageRanks, data.numSummarySentences);
    if (chart) details.appendChild(chart);
    rootDiv.appendChild(details);

    const loadingClock = document.getElementById('loading-clock');
    if (loadingClock) loadingClock.style.display = 'none';
    document.body.appendChild(rootDiv);
}

function _createParagraph(text: Sentence) {
    const p = document.createElement('div');
    p.className = 'paragraph';
    const pContent = document.createElement('div');
    pContent.className = 'p-content';
    pContent.textContent = text.content;
    const pRank = document.createElement('div');
    pRank.className = 'p-rank';
    pRank.textContent = `[Rank: ${text.rank}]`;
    p.appendChild(pContent);
    p.appendChild(pRank);
    return p;
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

attachWorker();