import { Chart } from "chart.js";
import { Timings } from './messages';


export function createChart(prArr: Array<number>, num_summary_sentences: number) {
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

export function createProfilingChart(timings: Timings, title: string) {
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