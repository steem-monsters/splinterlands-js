if (!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.scatterjs = (function () {
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

    async function waxTransactionScatter(memo, to, amount) {
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

        scatterPay(params, () => SM.ShowDialog('process_payment', {currency: 'WAX'}));
    }

    this.scatterPay = function (params, callback) {
        scatterInit().then(() => sendFromScatter(params, callback));
    }

    let scatterConn = null;

    async function scatterInit() {
        return new Promise(async (resolve, reject) => {
            if (scatterConn)
                return resolve(scatterConn);

            try {
                window.ScatterJS.plugins(new ScatterEOS());
                scatterConn = window.ScatterJS;
                window.ScatterJS = null;   // prevent Scatter identity leakage to malicious third parties

                resolve(scatterConn);
            } catch (err) {
                reject(err);
            }
        });
    }

    async function sendFromScatter(params, callback) {
        const {
            chain,
            source_account_type,
            destination_account,
            amount,
            precision,
            symbol,
            memo
        } = params;

        try {
            let account = await getScatterIdentity(chain, source_account_type);

            const network = scatterConn.Network.fromJson(chain);
            const eos = scatterConn.eos(network, window.Eos);
            const transactionOptions = {authorization: [`${account.name}@${account.authority}`]};

            await eos.transfer(account.name,
                destination_account,
                parseFloat(amount).toFixed(precision) + ' ' + symbol,   // this conversion adds back trailing zeroes to keep Scatter API happy
                memo,
                transactionOptions);

            if (callback) {
                callback();
            }
        } catch (err) {
            let message = err.message;
            if (typeof err === 'string') {
                console.error(err);
                errObj = JSON.parse(err);
                message = errObj.message;
                if (errObj.error && errObj.error.what) {
                    message = errObj.error.what;
                }
            }
            console.log(message)
        }
    }

    this.getScatterIdentity = async function (chain, source_account_type) {
        await scatterInit();

        return new Promise(async (resolve, reject) => {
            const network = scatterConn.Network.fromJson(chain);
            const connected = await scatterConn.connect('splinterlands.io', {network});

            if (!connected)
                return reject(`No ${source_account_type.toUpperCase()} wallet is available. Please make sure you have your ${source_account_type.toUpperCase()} wallet software or extension open and unlocked and try again.`);

            let id = await scatterConn.getIdentity({accounts: [network]});
            console.log(id);

            if (!id)
                return reject(`Could not connect to ${source_account_type.toUpperCase()} identity.`);

            resolve(id.accounts.find(x => x.blockchain === 'eos'));
        });
    }

    return {waxTransactionScatter};
})();
