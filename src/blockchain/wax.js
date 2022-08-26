if (!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.waxjs = (function () {
    async function waxPay(to, quantity, memo) {
        const wax = new waxjs.WaxJS('https://wax.greymass.com', null, null, false);
        try {
            const isAutoLoginAvailable = await wax.isAutoLoginAvailable();

            if (!isAutoLoginAvailable) {
                await wax.login();
            }

            await wax.api.transact({
                actions: [{
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [{
                        actor: wax.userAccount,
                        permission: 'active',
                    }],
                    data: {
                        from: wax.userAccount,
                        to,
                        quantity: quantity + ' WAX',
                        memo,
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 1200,
            });

            // SM.SubmitPayment('wax', '<%= data.payment %>', 'WAX');
        } catch (err) {
            console.log('WAX error: ', err);
        }
    }


    return {waxPay};
})();
