if(!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.walletConnect = (function() {
	let config = {
		infuraId: "bfb49469e8284560b1cf9ca30f359989"
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
