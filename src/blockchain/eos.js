if(!window.splinterlands)
    window.splinterlands = {};

window.splinterlands.eos = (function() {
	this.config = {
		scatter: {
			name: 'splinterlands.io',
			eos_network: {
				blockchain: 'eos',
				protocol: 'https',
				host: 'nodes.get-scatter.com',
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
			const connected = await scatterConn.connect(this.config.scatter.name, {network});

			if(!connected)
				return reject(`No ${source_account_type.toUpperCase()} wallet is available. Please make sure you have your ${source_account_type.toUpperCase()} wallet software or extension open and unlocked and try again.`);

			let id = await scatterConn.getIdentity({ accounts:[network] });

			if(!id)
				return reject(`Could not connect to ${source_account_type.toUpperCase()} identity.`);

			resolve(id.accounts.find(x => x.blockchain === 'eos'));
		});
	}

	this.scatterPay = async function(to, amount, memo) { 
		await scatterInit();
		return await sendFromScatter(to, amount, memo);
	}

	// auto-populate a transfer in Scatter Desktop wallet
	async function sendFromScatter(to, amount, memo) {
		try {
			let account = await getScatterIdentity(this.config.scatter.eos_network, 'eos');
			const network = scatterConn.Network.fromJson(this.config.scatter.eos_network);

			const eos = scatterConn.eos(network, window.Eos);
			const transactionOptions = { authorization:[`${account.name}@${account.authority}`] };
			return await eos.transfer(account.name, to, `${parseFloat(amount).toFixed(4)} EOS`, memo, transactionOptions);
		} catch (err) { return { error: err }; }
	}

	return { scatterPay };
})();