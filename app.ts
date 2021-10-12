import * as config from "./exchanges/config.json";
import { PoloniexApi } from "./exchanges/poloniex/poloniex-api";

const poloniexConfig = config.poloniex;

const poloniexApi = new PoloniexApi(
    poloniexConfig.apiKey,
    poloniexConfig.secretKey,
    poloniexConfig.publicUrl,
    poloniexConfig.privateUrl);

poloniexApi.returnBalances().then(result => console.log(result));
