/**
 * Text Rank algorithm implementation
 * modeled off of https://github.com/arnavroy/text-summarizer/blob/master/summarizer.js
 */

import *  as $ from "jquery";
import *  as _ from "underscore";

// var Summarizer = {};
// Summarizer.Utility = {};

// // Get text from an HTML document.
// function getTextFromHtml (someHtmlDoc) {
//     var tmp = document.createElement("DIV");
//     tmp.innerHTML = someHtmlDoc;
//     return tmp.textContent || tmp.innerText;
// }

// // Get sentences from text.
// export function getSentences(text) {
//     let sentences = text.split(/\. |\.|\?|!|\n/g);
//     $(sentences).each(function (idx) {
//         sentences[idx] = $.trim(sentences[idx]);
//     });
//     sentences = $(sentences).filter(function (idx) {
//         return sentences[idx].length > 0;
//     });
//     return sentences;
// }

// Calculate similarity between 2 sentences.
function calculateSimilarity(sentence1, sentence2) {
    const words1 = sentence1.split(" ");
    const words2 = sentence2.split(" ");
    const intersection = _.intersection(words1, words2);
    const sumOfLengths = Math.log(words1.length) + Math.log(words2.length);
    if (sumOfLengths === 0) {
        return 0;
    } else {
        return intersection.length / sumOfLengths; // JS uses floating point arithmetic by default.
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
    dampingFactor, delta) {
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
        _.each(adjacencyList, function (item) {
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
    const pageRankResults = {};
    for (let idx = 0; idx < totalNumNodes; ++idx) {
        pageRankResults[idx] = {
            "PR": pageRankStruct[idx]["oldPR"] / totalNumNodes,
            "sentence": graph.sentenceIdLookup[idx]
        };
    }
    return pageRankResults;
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
        _.each(graph[idx], function (adjNode) {
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
