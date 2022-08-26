if (!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.ethereum = (function () {
    let tokenContracts = {
        GAME: {
            address: '0x63f88A2298a5c4AEE3c216Aa6D926B184a4b2437',
            precision: 18
        },
        BAT: {
            address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
            precision: 18
        },
        UNI: {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            precision: 18
        },
        SAND: {
            address: '0x3845badAde8e6dFF049820680d1F14bD3903a5d0',
            precision: 18
        },
        GALA: {
            address: '0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA',
            precision: 8
        },
        ENJ: {
            address: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c',
            precision: 18
        },
        DAI: {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            precision: 18
        },
        EMP: {
            precision: 8,
            address: '0x3b248cefa87f836a4e6f6d6c9b42991b88dc1d58'
        },
        BUSD: {
            precision: 18,
            address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
        },
    };

    // auto-populate a transfer in Ethereum web3 wallet
    async function sendFromWeb3(to, amount) {
        if (!window.web3)
            return ({'error': true, 'message': 'web3 not found'});

        try {
            if (!window.WalletConnectProvider && !window.ethereum.accounts[0]) {
                await window.web3.givenProvider.enable();
            }

            if (!window.WalletConnectProvider && !window.ethereum.accounts[0] && !window.web3.eth.accounts.givenProvider.selectedAddress) {
                return ({'error': true, 'message': 'unknown error, please try again'});
            }

            const selectedAddress = window.WalletConnectProvider ? window.ethereum.accounts[0] : window.web3.eth.accounts.givenProvider.selectedAddress

            window.web3.eth.sendTransaction({
                from: selectedAddress,
                to: to,
                gas: 21000,
                value: window.web3.utils.toWei(amount, 'ether')
            })
                .on('transactionHash', (hash) => {
                    return hash
                })
                .on('error', (error, receipt) => {
                    if (typeof error === 'string')
                        return ({'error': true, 'message': error});
                    else
                        return error;
                });
        } catch (e) {
            console.log(e);
            if (typeof e === 'string')
                return ({'error': true, 'message': e});
            else
                return e;
        }
    }

    async function checkAllowance(token) {
        console.log('Calling checkAllowance...');
        return new Promise(async (resolve, reject) => {
            try {
                if (!window.web3 || !(window.WalletConnectProvider ? window.ethereum.accounts[0] : window.web3.eth.accounts.givenProvider.selectedAddress))
                    return reject('Ethereum wallet not found. Please make sure Metamask or another browser-based Ethereum wallet is installed and unlocked.');

                if (!tokenContracts[token])
                    return reject('Invalid or unsupported token symbol specified.');

                let player_address = window.WalletConnectProvider ? window.ethereum.accounts[0] : window.web3.eth.accounts.givenProvider.selectedAddress;
                let contract_addr = tokenContracts[token].address;

                let contract = new window.web3.eth.Contract(JSON.parse(splinterlands.get_settings().ethereum.contracts.crystals.abi.result), contract_addr);
                let allowance = await contract.methods.allowance(player_address, splinterlands.get_settings().ethereum.contracts.payments.address).call({from: player_address});

				console.log(allowance);

                resolve(web3.utils.toBN(allowance) >= web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffff'));
            } catch (err) {
                reject(err);
            }
        });
    }

    //async function approveToken(token) {
    function approveToken(token, status_update_callback) {
        console.log('Calling approveToken...');
        return new Promise(async (resolve, reject) => {
            try {
                if (!window.web3 || !(window.WalletConnectProvider ? window.ethereum.accounts[0] : window.web3.eth.accounts.givenProvider.selectedAddress))
                    return reject('Ethereum wallet not found. Please make sure Metamask or another browser-based Ethereum wallet is installed and unlocked.');

                if (!tokenContracts[token])
                    return reject('Invalid or unsupported token symbol specified.');

                let player_address = (window.WalletConnectProvider ? window.ethereum.accounts[0] : window.web3.eth.accounts.givenProvider.selectedAddress);
                let contract = new window.web3.eth.Contract(JSON.parse(splinterlands.get_settings().ethereum.contracts.crystals.abi.result), tokenContracts[token].address);
                let confirm_sent = false;

                contract.methods.approve(splinterlands.get_settings().ethereum.contracts.payments.address, web3.utils.toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').toString())
                    .send({from: player_address})
                    .on('transactionHash', hash => status_update_callback({
                        type: 'approval',
                        status: 'broadcast',
                        data: {hash}
                    }))
                    .on('confirmation', (confirmationNumber, receipt) => {
                        if (!confirm_sent) {
                            confirm_sent = true;
                            status_update_callback({
                                type: 'approval',
                                status: 'confirmed',
                                data: {confirmationNumber, receipt}
                            });
                        }

                        resolve(receipt);
                    })
                    .on('error', (error, receipt) => {
                        status_update_callback({type: 'approval', status: 'error', data: {error}});
                        reject(error);
                    });
            } catch (error) {
                status_update_callback({type: 'approval', status: 'error', data: {error}});
                reject(error);
            }
        });
    }

    async function payToken(token, amount, purchase_id, status_update_callback) {
        console.log('Calling payToken...');
        return new Promise(async (resolve, reject) => {
            try {
                if (!window.web3 || !(window.WalletConnectProvider ? window.ethereum.accounts[0] : window.web3.eth.accounts.givenProvider.selectedAddress))
                    return reject('Ethereum wallet not found. Please make sure Metamask or another browser-based Ethereum wallet is installed and unlocked.');

                if (!tokenContracts[token])
                    return reject('Invalid or unsupported token symbol specified.');

                let player_address = (window.WalletConnectProvider ? window.ethereum.accounts[0] : window.web3.eth.accounts.givenProvider.selectedAddress);
                let payments_addr = splinterlands.get_settings().ethereum.contracts.payments.address;
                let bn_amount = web3.utils.toBN(amount).mul(web3.utils.toBN(10).pow(web3.utils.toBN(tokenContracts[token].precision - 3)));
                let confirm_sent = false;

                let contract = new window.web3.eth.Contract(JSON.parse(splinterlands.get_settings().ethereum.contracts.payments.abi.result), payments_addr);
                contract.methods.payToken(tokenContracts[token].address, bn_amount.toString(), purchase_id)
                    .send({from: player_address})
                    .on('transactionHash', hash => status_update_callback({
                        type: 'payment',
                        status: 'broadcast',
                        data: {hash}
                    }))
                    .on('confirmation', (confirmationNumber, receipt) => {
                        if (!confirm_sent) {
                            confirm_sent = true;
                            status_update_callback({
                                type: 'payment',
                                status: 'confirmed',
                                data: {confirmationNumber, receipt}
                            });
                        }

                        resolve(receipt);
                    })
                    .on('error', (error, receipt) => {
                        status_update_callback({type: 'payment', status: 'error', data: {error}});
                        reject(error);
                    });
            } catch (error) {
                status_update_callback({type: 'payment', status: 'error', data: {error}});
                reject(error);
            }
        });
    }

    async function web3connect() {
        if (!window.ethereum)
            return null;

        try {
            let accounts = await ethereum.request({method: 'eth_accounts'});
            if (accounts && Array.isArray(accounts) && accounts.length > 0)
                return accounts[0];
        } catch (err) {
        }

        try {
            const addresses = await window.ethereum.enable();
            return addresses ? addresses[0] : null;
        } catch (err) {
            return null;
        }
    }

    async function walletConnect() {
        try {
            const {connect, connector, sendTx} = window.splinterlands.walletConnect;
            return {connect, connector, sendTx};
        } catch (e) {
            console.info(e)
        }
    }


    /**
     * Public functions
     */
    function hasWeb3Obj() {
        return (!!window.web3);
    }

    async function getIdentity() {
        if (!window.web3)
            return ({'error': true, 'message': 'web3 not found'});

        try {
            const publicKey = (await web3.eth.givenProvider.enable())[0];

            return {
                blockchain: 'ethereum',
                publicKey,
            }
        } catch (e) {
            console.log(e);
            if (typeof e === 'string')
                return ({'error': true, 'message': e});
            else
                return e;
        }
    }

    async function web3Auth(type) {
        if (!window.web3)
            return ({'error': true, 'message': 'web3 not found'});

        try {
            const enableRes = await web3.eth.givenProvider.enable();
            const address = enableRes[0];
            const ts = Math.floor(Date.now() / 1000);
            const msg = `${type || 'Login'}: ${address} ${ts}`;
            const sig = await web3.eth.personal.sign(web3.utils.utf8ToHex(msg), address);

            return {address, ts, msg, sig};
        } catch (e) {
            console.log(e);
            if (typeof e === 'string')
                return ({'error': true, 'message': e});
            else
                return e;
        }
    }

    async function web3Pay(to, amount) {
        try {
            await sendFromWeb3(to, amount);
        } catch (e) {
            console.log(e);
            if (typeof e === 'string')
                return ({'error': true, 'message': e});
            else
                return e;
        }
    }

    async function erc20Payment(token, amount, purchase_id, status_update_callback) {
        if (!status_update_callback)
            status_update_callback = console.log;

        let address = await web3connect();

        if (!address)
            return ({
                'error': true,
                'message': 'Ethereum wallet not found. Please make sure Metamask or another browser-based Ethereum wallet is installed and unlocked.'
            });

        if (!(await checkAllowance(token)))
            await approveToken(token, status_update_callback);

        await payToken(token, amount, purchase_id, status_update_callback);
    }

    async function bep20Payment(token, amount, purchase_id, status_update_callback) {
        if (!status_update_callback)
            status_update_callback = console.log;

        let address = await web3connect();

        if (!address)
            return ({
                'error': true,
                'message': 'Binance Smart Chain wallet not found or not connected. Please make sure Metamask or another browser-based Binance Smart Chain wallet is installed and unlocked.'
            });

        if (!(await checkAllowance(token)))
            await approveToken(token, status_update_callback);

        await payToken('bsc', amount, purchase_id, status_update_callback);
    }

    return {hasWeb3Obj, getIdentity, web3Auth, web3Pay, erc20Payment, walletConnect, bep20Payment};
})();
