const ConnectProvider = WalletConnectProvider.default;

if(!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.walletConnect = (function() {
	let config = {
		infuraId: "19233183444441bc985de5f05cfc65a9"
	}

	let connector = null;

	async function connect() {
		connector = new ConnectProvider(config);
		await connector.enable();
		const web3 = new Web3(connector);
		alert(await web3.eth.getAccounts());

	}

	async function sendTx(tx) {
		if (!connector) {
			return;
		}
		return connector.sendTransaction(tx)
	}

	return { connect, connector, sendTx  };
})();
