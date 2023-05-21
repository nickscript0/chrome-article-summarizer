/* eslint-disable @typescript-eslint/camelcase */
// Using @nem035's version due to this open issue running in the browser https://github.com/latitudegames/GPT-3-Encoder/issues/32
import { encode } from '@nem035/gpt-3-encoder';
import { GptPrice, GptPrices } from './messages';

const tokenLimits = {
    gpt35turbo: 4000,
    gpt4_8kContext: 8000,
    gpt4_32kContext: 32000
};

export function calculatePrices(
    numTokens: number | undefined
): GptPrices | undefined {
    /**
     * https://openai.com/pricing
     * gpt-3.5-turbo: $0.002 / 1K tokens
     */
    if (!numTokens) {
        // return 'Invalid number of tokens';
        return undefined;
    }

    const gpt35TurboPricePerToken = 0.002 / 1000;
    const gpt4_8kContext_pricePerToken = 0.06 / 1000;
    const gpt4_32kContext_pricePerToken = 0.12 / 1000;

    function calcStats(
        pricePerToken: number,
        numTokens: number,
        tokenLimit: number,
        modelName: string
    ): GptPrice {
        const percentOfTokenLimit = ((numTokens / tokenLimit) * 100).toFixed(1);
        return {
            totalPriceDollars: numTokens * pricePerToken,
            percentOfTokenLimit,
            requestsUntilTenDollars: (10 / (numTokens * pricePerToken)).toFixed(
                0
            ),
            requestsUntilOneDollar: (1 / (numTokens * pricePerToken)).toFixed(
                0
            ),
            modelName
        };
    }

    return {
        gpt35turbo: calcStats(
            gpt35TurboPricePerToken,
            numTokens,
            tokenLimits.gpt35turbo,
            'GPT-3.5 Turbo'
        ),
        gpt4_8kContext: calcStats(
            gpt4_8kContext_pricePerToken,
            numTokens,
            tokenLimits.gpt4_8kContext,
            'GPT-4 8k-context'
        ),
        gpt4_32kContext: calcStats(
            gpt4_32kContext_pricePerToken,
            numTokens,
            tokenLimits.gpt4_32kContext,
            'GPT-4 32k-context'
        )
    };
}

export function getNumTokens(text: string) {
    return encode(text).length;
}
