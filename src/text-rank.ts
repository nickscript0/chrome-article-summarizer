/**
 * Text Rank algorithm implementation
 * modeled off of https://github.com/arnavroy/text-summarizer/blob/master/summarizer.js
 */

// var Summarizer = {};
// Summarizer.Utility = {};

// // Get text from an HTML document.
// function getTextFromHtml (someHtmlDoc) {
//     var tmp = document.createElement("DIV");
//     tmp.innerHTML = someHtmlDoc;
//     return tmp.textContent || tmp.innerText;
// }

// Get sentences from text.
export function getSentences(text: string): Array<string> {
    const sentences = text.split(/\. |\.|\?|!|\n/g);
    return sentences.map(s => s.trim())
        .filter(s => s.length > 0);
}

// Calculate similarity between 2 sentences.
function calculateSimilarity(sentence1, sentence2) {
    const words1 = sentence1.split(" ");
    const words2set = new Set(sentence2.split(" "));
    const intersection = new Set(words1.filter(x => words2set.has(x)));
    const sumOfLengths = Math.log(words1.length) + Math.log(words2set.size);
    if (sumOfLengths === 0) {
        return 0;
    } else {
        return intersection.size / sumOfLengths; // JS uses floating point arithmetic by default.
    }
}

// Make directed graph.
export function makeGraph(sentences) {
    const graph = {};
    for (let idx1 = 0; idx1 < sentences.length; ++idx1) {
        for (let idx2 = idx1 + 1; idx2 < sentences.length; ++idx2) {
            if (graph[idx1] === undefined) {
                graph[idx1] = [];
            }

            if (graph[idx2] === undefined) {
                graph[idx2] = [];
            }
            const similarityScore = calculateSimilarity(
                sentences[idx1], sentences[idx2]);
            graph[idx1].push({
                "node": idx2,
                "weight": similarityScore
            });
            graph[idx2].push({
                "node": idx1,
                "weight": similarityScore
            });
        }
    }
    // Inculde a lookup from the sentenceId to the actual sentence.
    graph['sentenceIdLookup'] = sentences;
    return graph;
}

// Page Rank calculation driver.
export function calculatePageRank(graph, maxIterations,
    dampingFactor, delta): SummarizerResult {
    const pageRankStruct = {};
    const totalWeight = {};
    const totalNumNodes = graph.sentenceIdLookup.length; // Number of nodes.
    for (let idx = 0; idx < totalNumNodes; ++idx) {
        pageRankStruct[idx] = {
            "oldPR": 1.0,
            "newPR": 0.0
        };
        totalWeight[idx] = 0.0;
    }
    for (let idx = 0; idx < totalNumNodes; ++idx) {
        const adjacencyList = graph[idx];
        if (adjacencyList === undefined) {
            continue;
        }
        // The adjacency list is an array containg objects that contain the neighbours' index as
        // key and similarity score as the weight.
        adjacencyList.forEach(function (item) {
            totalWeight[idx] += item["weight"];
        });
    }
    let converged = false;
    for (let iter = 0; iter < maxIterations; ++iter) {
        let maxPRChange = runPageRankOnce(graph, pageRankStruct,
            totalWeight, totalNumNodes, dampingFactor);
        if (maxPRChange <= (delta / totalNumNodes)) {
            converged = true;
            break;
        }
    }
    const pageRankResults: Array<PageRankResult> = [];
    for (let idx = 0; idx < totalNumNodes; ++idx) {

        // pageRankResults[idx] = {
        //     "PR": pageRankStruct[idx]["oldPR"] / totalNumNodes,
        //     "sentence": graph.sentenceIdLookup[idx]
        // };
        pageRankResults.push(new PageRankResult(
            pageRankStruct[idx]["oldPR"] / totalNumNodes,
            graph.sentenceIdLookup[idx],
            idx
        ));
    }
    return new SummarizerResult(pageRankResults);
}

class PageRankResult {
    pagerank: number;
    sentence: string;
    index: number;
    constructor(pagerank, sentence, idx) {
        this.pagerank = pagerank;
        this.sentence = sentence;
        this.index = idx;
    }
}

class SummarizerResult {
    private prResultArr: Array<PageRankResult>;
    private orderIndexToPRMap: Map<number, number>;

    constructor(prResultArr: Array<PageRankResult>) {
        this.prResultArr = this._sortByPR(prResultArr);
        this.orderIndexToPRMap = new Map();
        this.prResultArr.forEach((el, i) => this.orderIndexToPRMap.set(el.index, i + 1));
    }

    private _sortByPR(arr: Array<PageRankResult>): Array<PageRankResult> {
        // Sort descending pagerank order
        return arr.sort((a, b) => b.pagerank - a.pagerank);
    }

    getSentencesOrderedByOccurence(maxSentences: number): Array<string> {
        return this._getTopPrResultOrderedByOccurence(maxSentences)
            .map(s => `${s.sentence} [Rank: ${this.orderIndexToPRMap.get(s.index)}]`);
    }

    _getTopPrResultOrderedByOccurence(maxSentences: number): Array<PageRankResult> {
        const sentences = this.prResultArr.slice(0, maxSentences);
        return sentences.sort((a, b) => a.index - b.index);
    }

    allPageRanks() {
        return this.prResultArr.slice(0, this.prResultArr.length)
            .map(s => s.pagerank);
    }

    getStatsText(maxSentences: number): string {
        // const sentences = this.prResultArr.slice(0, maxSentences);
        const topPRs = this._getTopPrResultOrderedByOccurence(maxSentences)
            .map(s => s.pagerank);

        return `${this.prResultArr.length} sentences reduced to ${maxSentences}`;
    }
}

// Single iteration of Page Rank.
function runPageRankOnce(graph, pageRankStruct,
    totalWeight, totalNumNodes, dampingFactor) {
    let sinkContrib = 0.0;
    for (let idx = 0; idx < totalNumNodes; ++idx) {
        if (graph[idx] === undefined || graph[idx].length === 0) {
            // Sink.
            sinkContrib += pageRankStruct[idx]["oldPR"];
            continue;
        }
        let wt = 0.0;
        // Now iterate over all the nodes that are pointing to this node.
        graph[idx].forEach(function (adjNode) {
            const node = adjNode["node"];
            // Get the total weight shared by this adjacent node and its neighbours.
            const sharedWt = totalWeight[node];
            if (sharedWt !== 0) { // To prevent NaN
                wt += (adjNode["weight"] / sharedWt) * pageRankStruct[node]["oldPR"];
            }
        });
        wt *= dampingFactor;
        wt += (1 - dampingFactor);
        // Update the structure w/ the new PR.
        pageRankStruct[idx]["newPR"] = wt;
    }
    // Apply the sink contrib overall.
    sinkContrib /= totalNumNodes;
    let max_pr_change = 0.0;
    for (let idx = 0; idx < totalNumNodes; ++idx) {
        pageRankStruct[idx]["newPR"] += sinkContrib;
        // Report back the max PR change.
        let change = Math.abs(pageRankStruct[idx]["newPR"] - pageRankStruct[idx][
            "oldPR"
        ]);
        if (change > max_pr_change) {
            max_pr_change = change;
        }
        // Set old PR to new PR for next iteration.
        pageRankStruct[idx]["oldPR"] = pageRankStruct[idx]["newPR"];
        pageRankStruct[idx]["newPR"] = 0.0;
    }
    return max_pr_change;
}
