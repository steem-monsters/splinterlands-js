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

	async function sendToken(to, qty, token_id) {
		let tx = await tronWeb.transactionBuilder.sendToken(to, qty, token_id, window.tronWeb.defaultAddress.base58);
		tx = await tronWeb.trx.sign(tx);
		return await tronWeb.trx.sendRawTransaction(tx);
	}

	function browser_payment_available() {
		return (window.tronWeb && window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) ? true : false;
	}

	return { sendTransaction, sendToken, browser_payment_available };
})();