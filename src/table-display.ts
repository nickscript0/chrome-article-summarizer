import { h } from 'maquette';
import { GptStats } from './messages';

// Defining the pick function that takes an object and an array of keys as parameters and returns a new object with only the picked keys
const pick = <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> => {
    // Using object destructuring and rest syntax to create the new object
    return {
        ...Object.fromEntries(
            Object.entries(obj).filter(([key]) => keys.includes(key as K))
        )
    } as Pick<T, K>;
};

function replaceKeys<T extends Record<string, any>>(
    obj: T,
    oldToNewKeyMap: Record<string, string>
) {
    if (Object.keys(obj).length !== Object.keys(oldToNewKeyMap).length) {
        throw new Error('Object and newKeys must be the same length');
    }
    const newObj = {};
    for (const [oldKey, newKey] of Object.entries(oldToNewKeyMap)) {
        newObj[newKey] = obj[oldKey];
    }
    return newObj as T;
}

function renderGptStatsTableFirst(data: GptStats) {
    // Creating an array of keys and values from the data object
    const stats = pick(data, [
        'numTokens',
        'numberOfCharacters',
        'numberOfWords'
    ]);

    const humanReadableStats = replaceKeys(stats, {
        numTokens: 'Number of Tokens',
        numberOfCharacters: 'Number of Characters',
        numberOfWords: 'Number of Words'
    });

    // Creating an array of table rows from the keys and values
    const rows = Object.entries(humanReadableStats).map(([k, v]) => {
        return h('tr', [
            h(
                'td',
                {
                    style:
                        'border: 1px solid #e0e0e0; padding: 10px; width: 35%; font-family: Arial; font-size: 16px; font-weight: bold;'
                },
                [k]
            ),
            h(
                'td',
                {
                    style:
                        'border: 1px solid #e0e0e0; padding: 10px; font-family: Arial; font-size: 16px;'
                },
                [v.toLocaleString()]
            )
        ]);
    });

    // Creating the table element with the rows
    const table = h(
        'table',
        { style: 'border-collapse: collapse; width: 100%;' },
        [
            h('thead', [
                // Using colspan attribute to make the header span two columns
                h('tr', [
                    h(
                        'th',
                        {
                            colspan: '2',
                            style:
                                'border: 1px solid #e0e0e0; padding: 10px; background-color: #f0f0f0; color: black; font-family: Arial; font-size: 20px; font-weight: bold; border-radius: 10px 10px 0 0;'
                        },
                        ['GPT Stats']
                    )
                ])
            ]),
            h('tbody', rows)
        ]
    );

    // Returning the table element
    return table;
}

// Creating a function to render the second table
function renderGptStatsTableSecond(data: GptStats) {
    // Creating an array of keys and values from the data.prices object
    const keys = data.prices ? Object.keys(data.prices) : [];
    const values = data.prices ? Object.values(data.prices) : [];

    // Creating an array of table rows from the keys and values
    const rows = keys.map((key, index) => {
        return h('tr', [
            h('td', { style: 'border: 1px solid black; padding: 10px;' }, [
                key
            ]),
            h('td', { style: 'border: 1px solid black; padding: 10px;' }, [
                `$${values[index].totalPriceDollars.toLocaleString()}`
            ]),
            h('td', { style: 'border: 1px solid black; padding: 10px;' }, [
                `${values[index].percentOfTokenLimit}%`
            ]),
            h('td', { style: 'border: 1px solid black; padding: 10px;' }, [
                values[index].requestsUntilTenDollars
            ]),
            h('td', { style: 'border: 1px solid black; padding: 10px;' }, [
                values[index].requestsUntilOneDollar
            ])
        ]);
    });

    // Creating the table element with the rows
    const table = h(
        'table',
        { style: 'border-collapse: collapse; width: 100%;' },
        [
            h('thead', [
                h('tr', [
                    h(
                        'th',
                        { style: 'border: 1px solid black; padding: 10px;' },
                        ['Model']
                    ),
                    h(
                        'th',
                        { style: 'border: 1px solid black; padding: 10px;' },
                        ['Total Price (USD)']
                    ),
                    h(
                        'th',
                        { style: 'border: 1px solid black; padding: 10px;' },
                        ['Percent of Token Limit']
                    ),
                    h(
                        'th',
                        { style: 'border: 1px solid black; padding: 10px;' },
                        ['Requests Until $10']
                    ),
                    h(
                        'th',
                        { style: 'border: 1px solid black; padding: 10px;' },
                        ['Requests Until $1']
                    )
                ])
            ]),
            h('tbody', rows)
        ]
    );

    // Returning the table element
    return table;
}

export function renderGptStatsTable(data: GptStats) {
    // Creating an array of keys and values from the data.prices object
    return h('div', [
        renderGptStatsTableFirst(data),
        h('br'),
        renderGptStatsTableSecond(data)
    ]);
}
