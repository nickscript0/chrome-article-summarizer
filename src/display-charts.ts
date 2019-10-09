import { Chart } from 'chart.js';
import { Timings } from './messages';

export function createChart(prArr: Array<number>, numSummarySentences: number) {
    return (canvasEl: HTMLCanvasElement) => {
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;
        const barChartData = {
            labels: Array.from(Array(prArr.length).keys()).map(x =>
                x.toString()
            ),
            datasets: [
                {
                    label: 'Page Rank Values',
                    // backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
                    // borderColor: window.chartColors.red,
                    borderWidth: 1,
                    data: prArr,
                    backgroundColor: Array(numSummarySentences).fill(
                        'rgba(75, 192, 192, 0.2)'
                    ),
                    borderColor: Array(numSummarySentences).fill(
                        'rgba(75, 192, 192, 1)'
                    )
                }
            ]
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

const pieChartColors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 205, 86)',
    'red'
];
export function createProfilingChart(timings: Timings, title: string) {
    return (canvasEl: HTMLCanvasElement) => {
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: timings.map(t => t.name),
                datasets: [
                    {
                        label: 'Processing time (ms)',
                        data: timings.map(t => t.value),
                        backgroundColor: pieChartColors.slice(0, timings.length)
                    }
                ]
            },
            options: {
                title: {
                    text: title,
                    display: true
                },
                legend: {
                    display: true,
                    fullWidth: false,
                    labels: {
                        fontSize: 10,
                        boxWidth: 10,
                        usePointStyle: true
                    } as any
                }
            }
        });
    };
}
