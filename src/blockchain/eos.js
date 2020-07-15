if(!window.splinterlands)
    window.splinterlands = {};

function loadScript(url, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    if(script.readyState) {  //IE
        script.onreadystatechange = function() {
        if(script.readyState === "loaded" || script.readyState === "complete") {
            script.onreadystatechange = null;
            callback();
        }
        };
    } else if(callback) {  //Others
        script.onload = function() {
        callback();
        };
    }
    
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild( script );
}

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
			},
			wax_network: {
				blockchain: 'eos',
				protocol: 'https',
				host: 'chain.wax.io',
				port: 443,
				chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'
			}
		}
    };
    let scatterConn = null;

	this.scatterPay = function(params, callback) {
		if(!scatterConn) {
			// initialize Scatter API upon first use
			loadScript('https://hive.steemmonsters.io/scripts/libraries/eos/scatter/2020-01-15/scatterjs-core.min.js', () => {
				loadScript('https://hive.steemmonsters.io/scripts/libraries/eos/scatter/2020-01-15/scatterjs-plugin-eosjs.min.js', () => {
					loadScript('https://hive.steemmonsters.io/scripts/libraries/eos/eosjs/16.0.9/eos.min.js', () => {
						window.ScatterJS.plugins( new ScatterEOS() );
						scatterConn = window.ScatterJS;
						window.ScatterJS = null;   // prevent Scatter identity leakage to malicious third parties

						sendFromScatter(params, callback);
					});
				});
			});
		} else {
			sendFromScatter(params, callback);
		}
	}

	// auto-populate a transfer in Scatter Desktop wallet
	async function sendFromScatter(params, callback) {
		const {
			chain,
			source_account_type,
			destination_account,
			amount,
			precision,
			symbol,
			memo
		} = params;

		try {
			//SM.ShowLoading();
			const network = scatterConn.Network.fromJson(this.config.scatter.eos_network);
			const connected = await scatterConn.connect(this.config.scatter.name + '-' + source_account_type, {network});
			if(!connected) {
				throw new Error('Scatter Desktop not open');
			}

			const requiredFields = { accounts:[network] };
			let id = await scatterConn.getIdentity(requiredFields);
			if(!id) {
				throw new Error('Could not connect Scatter identity');
			}

			let account = id.accounts.find(x => x.blockchain === 'eos');
			const eos = scatterConn.eos(network, window.Eos);
			const transactionOptions = { authorization:[`${account.name}@${account.authority}`] };

			await eos.transfer(account.name,
				destination_account,
				parseFloat(amount).toFixed(precision) + ' ' + symbol,   // this conversion adds back trailing zeroes to keep Scatter API happy
				memo,
				transactionOptions);

			//SM.HideLoading();
			if(callback) {
				callback();
			}
		} catch (err) {
			//SM.HideLoading();
			let message = err.message;
			if(typeof err === 'string') {
				console.error(err);
				errObj = JSON.parse(err);
				message = errObj.message;
				if(errObj.error && errObj.error.what) {
					message = errObj.error.what;
				}
			}
			//alert(SM.Translator.t('dec.err_completing',{_:`There was an error completing this transaction. Please ensure that your %{wallet_name} wallet is installed and unlocked.`, wallet_name: 'Scatter'}) + '\n\nError: ' + message);
		}
	}

	return { scatterPay };
})();