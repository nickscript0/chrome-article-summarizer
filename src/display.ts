// Displays the summarized text in a fresh page

import { Chart } from "chart.js";
import { SummaryData, Commands, Sentence } from './messages';

function attachWorker() {
    const worker = new SharedWorker(chrome.runtime.getURL('build/summarize_worker.bundle.js'));
    worker.port.addEventListener('message', function (e) {
        if (e.data.type === Commands.Display) {
            console.log(`Total processing time before Display : ${getTimeDiffMs(e.data.startTime)}ms`);
            display(e.data.payload);
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

function display(data: SummaryData) {
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

    // Add stats text
    const pre = document.createElement('pre');
    pre.textContent = data.textStats + '\n' + data.wordStats;
    pre.className = 'stats-text';
    rootDiv.appendChild(document.createElement('br'));
    rootDiv.appendChild(pre);
    const chart = _createChart(data.pageRanks, data.numSummarySentences);
    if (chart) rootDiv.appendChild(chart);
    document.body.appendChild(rootDiv);
}

function _createParagraph(text: Sentence) {
    const p = document.createElement('div');
    p.textContent = text.content;
    p.className = 'paragraph';
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
    div.style.width = '800px';
    div.style.height = '400px';
    div.style.textAlign = 'center';
    div.appendChild(canvasEl);
    return div;
}

attachWorker();