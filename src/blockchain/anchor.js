if (!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.anchorjs = (function () {
    async function anchorPay(params, callback) {
        const {
            chain,
            source_account_type,
            destination_account,
            amount,
            precision,
            symbol,
            memo
        } = params;

        const transport = new AnchorLinkBrowserTransport();

        const link = new AnchorLink({
            transport,
            chainId: chain.chainId,
            rpc: `${chain.protocol}://${chain.host}`
        });

        const action = {
            account: 'eosio.token',
            name: 'transfer',
            authorization: [{
                actor: '............1', // ............1 will be resolved to the signing accounts permission
                permission: '............2' // ............2 will be resolved to the signing accounts authority
            }],
            data: {
                from: '............1',
                to: destination_account,
                quantity: parseFloat(amount).toFixed(precision) + ' ' + symbol,
                memo,
            }
        }

        let result = await link.transact({action});
        console.log(result);

        if (callback) {
            callback();
        }
    }

    async function waxTransactionAnchor(memo, to, amount) {
        const chain = {
            blockchain: 'eos',
            protocol: 'https',
            host: 'chain.wax.io',
            port: 443,
            chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'
        }
        const params = {
            chain,
            source_account_type: 'wax',
            destination_account: to,
            amount,
            precision: 8,
            symbol: 'WAX',
            memo
        };

        await anchorPay(params);
    }
    return {waxTransactionAnchor};
})();
