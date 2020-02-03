if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.tron = (function() {
	async function loadTronWeb() {
		if(!window.tronWeb)
			await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/TronWeb.js');

		window.tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
	}

	async function sendTransaction(signed_tx) {
		// Make sure the TronWeb JS is loaded
		await loadTronWeb();

		// Broadcast the transaction
		return await tronWeb.trx.sendRawTransaction(signed_tx);
	}

	return { sendTransaction };
})();