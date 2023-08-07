if (!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.sscjs = (function () {
    async function initSSC() {
        await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/ssc.min.js');
    }

    async function initSSCAndSSCHE() {
        if (!SSC) {
            await initSSC();
        }
        splinterlands.ssc = new SSC('https://api.steem-engine.net/rpc');
        splinterlands.ssc_he = new SSC('https://api.hive-engine.com/rpc')

    }

    return {initSSC, initSSCAndSSCHE};
})();
