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

	this.scatterPay = async function(amount, memo) {
		if(!scatterConn) { // initialize Scatter API upon first use
			await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/eos/scatterjs-core.min.js');
			await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/eos/scatterjs-plugin-eosjs.min.js');
			await splinterlands.utils.loadScriptAsync('https://d36mxiodymuqjm.cloudfront.net/libraries/eos/eos.min.js');
			
			window.ScatterJS.plugins( new ScatterEOS() );
			scatterConn = window.ScatterJS;
			window.ScatterJS = null;   // prevent Scatter identity leakage to malicious third parties
			
			return sendFromScatter(amount, memo);					
		} else {
			return sendFromScatter(amount, memo);
		}
	}

	// auto-populate a transfer in Scatter Desktop wallet
	async function sendFromScatter(amount, memo) {
		const params = {
			source_account_type: 'eos',
			destination_account: 'splinterland',
			precision: 4,
			symbol: 'EOS',
		};

		return new Promise(async (resolve, reject) =>  {
			const network = scatterConn.Network.fromJson(this.config.scatter.eos_network);			
			const connected = await scatterConn.connect(this.config.scatter.name + '-' + params.source_account_type, {network});			
			if(!connected) {
				reject('Scatter wallet not found');
			}
	
			const requiredFields = { accounts:[network] };
			let id = await scatterConn.getIdentity(requiredFields);
			if(!id) {
				reject('Could not connect Scatter identity');
			}
	
			let account = id.accounts.find(x => x.blockchain === 'eos');
			const eos = scatterConn.eos(network, window.Eos);
			const transactionOptions = { authorization:[`${account.name}@${account.authority}`] };
	
			resolve(eos.transfer(account.name,
				params.destination_account,
				parseFloat(amount).toFixed(params.precision) + ' ' + params.symbol,   // this conversion adds back trailing zeroes to keep Scatter API happy
				memo,
				transactionOptions));
		});
	}

	return { scatterPay };
})();