// Displays the summarized text in a fresh page

import { Chart } from "chart.js";
import { SummaryData, Commands } from './messages';


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === Commands.Display) {
        display(request.data);
    }
});

function display(data: SummaryData) {
    const rootDiv = document.createElement('div');
    rootDiv.style.padding = '50px';
    rootDiv.style.marginLeft = '100px';
    rootDiv.style.marginRight = '100px';

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
    pre.style.fontSize = '14px';
    rootDiv.appendChild(document.createElement('br'));
    rootDiv.appendChild(pre);
    const chart = _createChart(data.pageRanks, data.numSummarySentences);
    if (chart) rootDiv.appendChild(chart);

    console.log(`Appending a rootDiv ${JSON.stringify(rootDiv)}`);
    document.body.appendChild(rootDiv);
}

function _createParagraph(text: string) {
    const p = document.createElement('p');
    p.textContent = text;
    p.style.fontSize = '15px';
    return _setFontStyle(p);
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

function _setFontStyle(e: HTMLElement) {
    // Font styling modeled off of nytimes
    e.style.fontFamily = `georgia, "times new roman", times, serif`;
    e.style.color = 'black';
    return e;
}
