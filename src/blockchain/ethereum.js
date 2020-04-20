if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.ethereum = (function() {
	async function sendTransaction(signed_tx) {
		// Broadcast the transaction
		return await splinterlands.api('/transactions/broadcast_eth_tx', { signed_tx });
	}

	return { sendTransaction };
})();