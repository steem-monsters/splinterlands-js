if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.ethereum = (function() {
	async function sendTransaction(signed_tx) {
		// Broadcast the transaction
		return await splinterlands.api('/transactions/broadcast_eth_tx', { signed_tx });
	}

	function hasWeb3Obj() {
		return (!!window.web3);
	}

	async function getIdentity() {
		if (!window.web3)
			return ({ "error" : true, "web3 not found": e });

		try {
			const publicKey = (await web3.eth.givenProvider.enable())[0];

			return {
				blockchain: 'ethereum',
				publicKey,
			}
		} catch(e) {
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e; 
		}
	}	 

	async function web3Auth(type) {
		if (!window.web3)
			return ({ "error" : true, "web3 not found": e });

		try {
			const enableRes = await web3.eth.givenProvider.enable();
			const address = enableRes[0];
			const ts = Math.floor(Date.now() / 1000);
			const msg = `${type || 'Login'}: ${address} ${ts}`;
			const sig = await web3.eth.personal.sign(web3.utils.utf8ToHex(msg), address);
			
			return { address, ts, msg, sig };
		} catch(e) {
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e;
		}
	}

	return { sendTransaction, hasWeb3Obj, getIdentity, web3Auth };
})();