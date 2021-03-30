if(!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.eos = (function() {
	let config = {
		scatter: {
			name: 'splinterlands.io',
			eos_network: {
				blockchain: 'eos',
				protocol: 'https',
				host: 'eos.greymass.com',
				port: 443,
				chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
			}
		}
	};
		
	let scatterConn = null;	

	async function scatterInit() {
		return new Promise(async (resolve, reject) => {
			if(scatterConn)
				return resolve(scatterConn);

			try {
				await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/eos/scatterjs-core.min.js');
				await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/eos/scatterjs-plugin-eosjs.min.js');
				await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/eos/eos.min.js');

				window.ScatterJS.plugins(new ScatterEOS());
				scatterConn = window.ScatterJS;
				window.ScatterJS = null;   // prevent Scatter identity leakage to malicious third parties

				resolve(scatterConn);
			} catch(err) { reject(err); }
		});
	}

	async function getScatterIdentity(chain, source_account_type) {
		return new Promise(async (resolve, reject) => {
			const network = scatterConn.Network.fromJson(chain);
			const connected = await scatterConn.connect(config.scatter.name, {network});

			if(!connected)
				return reject(`No ${source_account_type.toUpperCase()} wallet is available. Please make sure you have your ${source_account_type.toUpperCase()} wallet software or extension open and unlocked and try again.`);

			let id = await scatterConn.getIdentity({ accounts:[network] });

			if(!id)
				return reject(`Could not connect to ${source_account_type.toUpperCase()} identity.`);

			resolve(id.accounts.find(x => x.blockchain === 'eos'));
		});
	}

	// auto-populate a transfer in Scatter Desktop wallet
	async function sendFromScatter(to, amount, memo) {
		try {
			let account = await getScatterIdentity(config.scatter.eos_network, 'eos');
			const network = scatterConn.Network.fromJson(config.scatter.eos_network);

			const eos = scatterConn.eos(network, window.Eos);
			const transactionOptions = { authorization:[`${account.name}@${account.authority}`] };
			return await eos.transfer(account.name, to, `${parseFloat(amount).toFixed(4)} EOS`, memo, transactionOptions);
		} catch (err) { return { error: err }; }
	}	


	/**
	 * Public functions
	 */
	async function getIdentity() {
		let account = null; 
		try {
			await scatterInit();		
			account = await getScatterIdentity(config.scatter.eos_network, 'eos');
		
			return account;
		} catch(e) { 
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e; 
		}
	}	 

	async function hasIdentity() {
		let account = null; 
		try {
			await scatterInit();		
			account = await getScatterIdentity(config.scatter.eos_network, 'eos');
		
			return (account.name != null);
		} catch(e) { 			
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e; 
		}
	}	 

	async function scatterAuth() {
		let account = null; 
		try {
			await scatterInit();		
			account = await getScatterIdentity(config.scatter.eos_network, 'eos');

			let ts = Math.floor(Date.now() / 1000);
			let msg = `Login: ${account.name} ${ts}`;
			return { address: account.name, ts, msg, sig: await scatterConn.getArbitrarySignature(account.publicKey, msg) };
		} catch(e) {
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e;
		}
	}

	async function scatterPay(to, amount, memo) {
		try { 
			await scatterInit();
			return await sendFromScatter(to, amount, memo);
		} catch(e) { 			
			console.log(e); 
			if(typeof e === 'string')
				return ({ "error" : true, "message": e });
			else 
				return e; 
		}
	}

	return { getIdentity, hasIdentity, scatterAuth, scatterPay  };
})();