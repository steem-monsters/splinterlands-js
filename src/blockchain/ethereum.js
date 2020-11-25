if(!window.splinterlands)
	window.splinterlands = {};

window.splinterlands.ethereum = (function() {

	// auto-populate a transfer in Ethereum web3 wallet
	async function sendFromWeb3(to, amount) {
		if (!window.web3)
			return ({ "error" : true, "message": "web3 not found" });

		try {
			await window.web3.givenProvider.enable();

			if(!window.web3.eth.accounts.givenProvider.selectedAddress) {
				return ({ "error" : true, "message": "unknown error, please try again" });
			}

			window.web3.eth.sendTransaction({
				from: window.web3.eth.accounts.givenProvider.selectedAddress,
				to: to,
				gas: 21000,
				value: window.web3.utils.toWei(amount, 'ether')
			})
			.on('transactionHash', (hash) => { return hash })
			.on('error', (error, receipt) => { 
				if(typeof error === 'string')
					return ({ "error" : true, "message": error });
				else 
					return error;			
			});
		} catch(e) {
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e; 
		}
	}	


	/**
	 * Public functions
	 */
	async function sendTransaction(signed_tx) {
		// Broadcast the transaction
		return await splinterlands.api('/transactions/broadcast_eth_tx', { signed_tx });
	}

	function hasWeb3Obj() {
		return (!!window.web3);
	}

	async function getIdentity() {
		if (!window.web3)
			return ({ "error" : true, "message": "web3 not found" });

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
			return ({ "error" : true, "message": "web3 not found" });

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

	async function web3Pay(to, amount) {
		try {
			await sendFromWeb3(to, amount);			
		} catch (e)  {
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e;
		}
	}

	return { sendTransaction, hasWeb3Obj, getIdentity, web3Auth, web3Pay };
})();