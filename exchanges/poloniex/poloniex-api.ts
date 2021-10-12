import axios from "axios";
import crypto from "crypto";

export class PoloniexApi {
    private key: string;
    private secret: string;
    private publicUrl: string;
    private privateUrl: string;

    constructor(key: string, secret: string, publicUrl: string, privateUrl: string) {
        this.key = key;
        this.secret = secret;
        this.publicUrl = `${publicUrl}?command=`;
        this.privateUrl = privateUrl;
    }

    public async returnTicker(): Promise<CurrencyPairInfo[]> {
        const response = await axios(`${this.publicUrl}${PublicCommands.returnTicker}`);
        const responseData: { [key: string]: SummaryInfo } = response.data;
        const currencyPairsInfo: CurrencyPairInfo[] = [];

        for (let field in responseData) {
            currencyPairsInfo.push({
                currencyPair: field,
                summaryInfo: responseData[field]
            });
        }

        return currencyPairsInfo;
    }

    public async returnOrderBook(currencyPair: string, depth: string = "50"): Promise<OrderBookInfo> {
        const url = this.buildUrl(
            `${this.publicUrl}${PublicCommands.returnOrderBook}`,
            [
                { name: "currencyPair", value: currencyPair },
                { name: "depth", value: depth }
            ]);
        const response = await axios(url);

        return response.data as OrderBookInfo;
    }

    public async returnChartData(
        currencyPair: string,
        period: string,
        start: string,
        end: string): Promise<CandlestickChartData[]> {
        const url = this.buildUrl(
            `${this.publicUrl}${PublicCommands.returnChartData}`,
            [
                { name: "currencyPair", value: currencyPair },
                { name: "period", value: period },
                { name: "start", value: start },
                { name: "end", value: end }
            ]
        );
        const response = await axios(url);

        return response.data as CandlestickChartData[];
    }

    public async returnBalances(): Promise<Balance[]> {
        const payload = this.getPayload(PrivateCommands.returnBalances);
        const response = await axios.post(this.privateUrl, payload, {
            headers: {
                Key: this.key,
                Sign: this.getSignCrypto(payload)
            }
        });

        const stringifyData = JSON.stringify(response.data);
        const parsedData: { [key: string]: number } = JSON.parse(stringifyData);
        const balances: Balance[] = [];

        for (let field in parsedData) {
            balances.push({
                currency: field,
                balances: parsedData[field]
            });
        }

        return balances;
    }

    private getSignCrypto(payload: string): string {
        return crypto.createHmac("sha512", this.secret).update(payload).digest("hex")
    }

    private getPayload(privateCommand: PrivateCommands): string {
        // The nonce parameter is an integer which must always be greater than the previous nonce used and
        // does not need to increase by one.
        // Using the epoch in milliseconds is an easy choice here but be careful about time synchronization
        // if using the same API key across multiple servers.
        const nonce = Date.now() * 100;
        const payload = `command=${privateCommand}&nonce=${nonce}`;
        return payload;
    }

    private buildUrl(baseUrl: string, options: { name: string, value: string }[]): string {
        const url = new URL(baseUrl);
        options.forEach(option => {
            url.searchParams.append(option.name, option.value);
        })
        return url.href;
    }
}

enum PublicCommands {
    returnTicker = "returnTicker",
    returnOrderBook = "returnOrderBook",
    returnChartData = "returnChartData"
}

enum PrivateCommands {
    returnBalances = "returnBalances"
}

interface SummaryInfo {
    id: string;
    last: number;
    lowestAsk: number;
    highestBid: number;
    percentChange: number;
    baseVolume: number;
    quoteVolume: number;
    isFrozen: number;
    postOnly: number;
    high24hr: number;
    low24hr: number;
}

interface CurrencyPairInfo {
    currencyPair: string;
    summaryInfo: SummaryInfo;
}

interface OrderBookInfo {
    asks: [{ low: number, high: number }];
    bids: [{ low: number, high: number }];
    isFrozen: string,
    postOnly: string,
    seq: number
}

interface CandlestickChartData {
    date: string,
    high: number,
    low: number,
    open: number,
    close: number,
    volume: number,
    quoteVolume: number,
    weightedAverage: number
}

interface Balance {
    currency: string;
    balances: number;
}

export { PublicCommands }
