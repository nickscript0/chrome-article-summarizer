
export function getPageText() {
    const rootDiv = document.createElement('div');
    const textBlock = findNodesWithNWords(10);
    let i = 1;
    for (const text of textBlock) {
        const p = document.createElement('p');
        p.textContent = `Block ${i}: ${text}`;
        rootDiv.appendChild(p);
        i += 1;
    }

    document.body.innerHTML = "";
    document.body.appendChild(rootDiv);
    console.log(`Wrote document body!`);
}

// Skip these element types and all their children
const ELEMENT_REJECT_BLACKLIST = ['style', 'script', 'button', 'nav'];

class StringCounter {
    private stringCounts: Map<string, number>;
    constructor() {
        this.stringCounts = new Map();
    }

    incr(s: string) {
        const last = this.stringCounts.get(s);
        const next = (last) ? last + 1 : 1;
        this.stringCounts.set(s, next);
    }

    toString() {
        return Array.from(this.stringCounts.keys())
            .map(k => `${k}: ${this.stringCounts.get(k)}`)
            .join('\n');
    }
}

function findNodesWithNWords(minWords: number): Array<string> {
    const rejectCounter = new StringCounter();

    const filter_by_word: NodeFilter = {
        acceptNode: n => {
            const parentNode = n.parentNode;
            // if (parentNode && parentNode.nodeName !== '#text') console.log(`parentNode.nodeName is ${parentNode.nodeName}`);
            if (parentNode && ELEMENT_REJECT_BLACKLIST.includes(parentNode.nodeName.toLowerCase())) {
                rejectCounter.incr(parentNode.nodeName.toLocaleLowerCase());
                return NodeFilter.FILTER_REJECT;
            } else if (_wordCount(n.textContent) >= minWords) {
                return NodeFilter.FILTER_ACCEPT;
            } else {
                return NodeFilter.FILTER_SKIP;
            }
        }

    };
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        // NodeFilter.SHOW_ALL,
        filter_by_word,
        false
    );

    let n;
    const matched_nodes: Array<string> = [];
    while (n = walker.nextNode()) {
        matched_nodes.push(n.textContent);
    }

    console.log(`Rejected Nodes: ${rejectCounter.toString()}`);
    return matched_nodes;
}

function _wordCount(s: string | null): number {
    if (s === null || s.trim() === '') return 0;
    const words = s.match(/(\w+)/g);
    return (words) ? words.length : 0;
}