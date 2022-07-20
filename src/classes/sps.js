splinterlands.SPS = class {
    static async playerSPS() {
        return splinterlands.api('/players/sps');
    }

    static async playerSPSBalance() {
        return splinterlands.api('players/sps_data');
    }

    static loadAllPrices() {
        return 'https://prices.splinterlands.com/prices';
    }

    static async claim_hive() {
        const ts = Date.now();

        if (splinterlands.use_keychain()) {
            console.log('splinterlands.use_keychain', splinterlands.use_keychain);
            hive_keychain.requestSignBuffer(splinterlfands.get_player().name, `hive${splinterlands.get_player().name}${ts}`, 'Posting', async (sign_response) => {
                if (!sign_response || sign_response.error) {
                    return (`There was an error claiming your airdrop: ${sign_response && sign_response.error ? sign_response.error : 'Unknown error'}`);
                }

                this.send_claim('hive', splinterlands.get_player().name, sign_response.result, ts);
            });
        } else {
            const sig = eosjs_ecc.sign(`hive${splinterlands.get_player().name}${ts}`, localStorage.getItem('splinterlands:key'));
            this.send_claim('hive', splinterlands.get_player().name, sig, ts);
        }
    }

    static async send_claim(platform, address, sig, ts) {
        try {
            let claim_result = await splinterlands.ec_api('/players/claim_sps_airdrop', {platform, address, sig, ts});

            if (!claim_result || claim_result.error) {
                return `There was an error claiming your airdrop: ${claim_result && claim_result.error ? claim_result.error : 'Unknown error'}`;
            }
        } catch (err) {
            return `There was an error claiming your airdrop: ${err && err.message ? err.message : err}`;
        }

        await timeout(10000);
    }
}
