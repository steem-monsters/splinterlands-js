splinterlands.Events = class {
    static async createTournament(data) {
        return splinterlands.send_tx_wrapper('create_tournament', 'Create Tournament', data, tx => tx)
    }

    static async enterTournament(
        id,
        format,
        entryFee,
        allowedCardsStr,
        prizeCurrenciesStr,
        cpMin,
        signedPw
    ) {
        await this.checkTournamentCards(allowedCardsStr, cpMin, 'tournament', format, null, () => this.submitEnterTournament(id, entryFee, signedPw));
    }

    static async checkTournamentCards(
        allowedCardsStr,
        cpMin,
        eventType,
        format,
        player,
        callback
    ) {
        const allowedCards = JSON.parse(allowedCardsStr);
        const maxEditionCount = allowedCards.epoch === 'modern' ? splinterlands.get_settings().modern_num_editions : splinterlands.get_settings().num_editions;
        const maxSetCount = allowedCards.epoch === 'modern' ? 2 : splinterlands.get_settings().core_editions.length;
        const isEditionRestricted =
            (allowedCards.editions && allowedCards.editions.length > 0 && allowedCards.editions.length < maxEditionCount) ||
            (allowedCards.sets && allowedCards.sets.length > 0 && allowedCards.sets.length < maxSetCount);
        const {editionNames, editionText} = allowedCards.editions ?
            this.constructTournamentAllowedEditionsText(allowedCards.editions, allowedCards.epoch, false) :
            this.constructTournamentAllowedSetsText(allowedCards.sets, allowedCards.epoch, false);
        const ghost = allowedCards && allowedCards.ghost;

        if (allowedCards.foil === 'gold_only' || cpMin > 0 ||
            (isEditionRestricted && allowedCards.editions && !allowedCards.editions.find(e => splinterlands.get_settings().starter_editions.includes(e))) ||
            (isEditionRestricted && allowedCards.sets && !allowedCards.sets.find(s => splinterlands.get_settings().starter_editions.includes(s.core)))) {

            if (ghost && cpMin === 0) {
                callback();
                return;
            }

            const collection = await splinterlands.load_collection();

            // verify collection power entry requirement is met
            if (cpMin > 0) {
                const player_tournament_cp = this.calculatePlayerTournamentPower(splinterlands.get_player().name, allowedCards, collection);
                if (player_tournament_cp < cpMin) {
                    return {error: `You only have ${splinterlands.utils.add_commas(player_tournament_cp)} Power eligible for this event, which is less than the required minimum. Increase your Power by adding more cards to your Collection!`};
                }
            }

            // If ghost we don't care what cards they have as long as they passed the above cpMin check
            if (ghost) {
                callback();
                return;
            }

            // Dec. 16, 2021 UPDATE: Anytime (Swiss) events no longer have requirements to
            // hold cards when joining or at event start. Players can simply rent what they need in order to battle.
            if (format === 'swiss') {
                callback();
                return;
            }

            const summoners = collection.filter(c => c.type == 'Summoner' && (allowedCards.epoch !== 'modern' || splinterlands.is_card_in_modern_sets(parseInt(c.editions.split(',')[0]), c.tier, c.id)));
            const monsters = collection.filter(c => c.type == 'Monster' && (allowedCards.epoch !== 'modern' || splinterlands.is_card_in_modern_sets(parseInt(c.editions.split(',')[0]), c.tier, c.id)));

            let allowed_summoners = 0, allowed_monsters = 0;
            if (allowedCards.foil === 'gold_only') {
                if (allowedCards.editions) {
                    // deprecated method, left in for backwards compatibility
                    allowed_summoners = summoners.map(c => c.owned ? c.owned.filter(o => o.gold && (!isEditionRestricted || (isEditionRestricted && allowedCards.editions.includes(o.edition)))).length : 0).filter(c => c > 0).length;
                    allowed_monsters = monsters.map(c => c.owned ? c.owned.filter(o => o.gold && (!isEditionRestricted || (isEditionRestricted && allowedCards.editions.includes(o.edition)))).length : 0).filter(c => c > 0).length;
                } else {
                    // new set-centric way
                    allowed_summoners = summoners.map(c => c.owned ? c.owned.filter(o => o.gold && (!isEditionRestricted || (isEditionRestricted && splinterlands.is_card_in_sets(allowedCards.sets, o.edition, c.tier, c.id)))).length : 0).filter(c => c > 0).length;
                    allowed_monsters = monsters.map(c => c.owned ? c.owned.filter(o => o.gold && (!isEditionRestricted || (isEditionRestricted && splinterlands.is_card_in_sets(allowedCards.sets, o.edition, c.tier, c.id)))).length : 0).filter(c => c > 0).length;
                }

                if (allowed_summoners == 0 || allowed_monsters < 6) {
                    let alertMsg = player ?
                        `This is a Gold Card only ${eventType} and it doesn't look like @${player} has enough Gold Cards to participate (need at least 6 Monsters and 1 Summoner).` :
                        `This is a Gold Card only ${eventType} and it doesn't look like you have enough Gold Cards in your collection (need at least 6 Monsters and 1 Summoner). You can get more by purchasing booster packs or buy them directly from the market if you want to participate in these events in the future.`;
                    return {error: alertMsg};
                } else if (allowed_monsters < 20) {
                    let confirmMsg = player ?
                        `This is a Gold Card only ${eventType} and @${player} may not have enough Gold Cards to compete effectively. Are you sure you want to continue?` :
                        `This is a Gold Card only ${eventType}. Please make sure you have enough Gold Cards to participate. You can see what Gold Cards you have by clicking the "Gold Only" button on the collection screen. Are you sure you want to continue?`;
                    if (confirm(confirmMsg)) {
                        callback();
                        return;
                    }
                } else {
                    callback();
                    return;
                }
            } else if (isEditionRestricted) {
                if (allowedCards.editions) {
                    // deprecated method, left in for backwards compatibility
                    allowed_summoners = summoners.map(c => c.owned ? c.owned.filter(o => allowedCards.editions.includes(o.edition)).length : 0).filter(c => c > 0).length;
                    allowed_monsters = monsters.map(c => c.owned ? c.owned.filter(o => allowedCards.editions.includes(o.edition)).length : 0).filter(c => c > 0).length;
                } else {
                    // new set-centric way
                    allowed_summoners = summoners.map(c => c.owned ? c.owned.filter(o => splinterlands.is_card_in_sets(allowedCards.sets, o.edition, c.tier, c.id)).length : 0).filter(c => c > 0).length;
                    allowed_monsters = monsters.map(c => c.owned ? c.owned.filter(o => splinterlands.is_card_in_sets(allowedCards.sets, o.edition, c.tier, c.id)).length : 0).filter(c => c > 0).length;
                }

                if (allowed_summoners == 0 || allowed_monsters < 6) {
                    let packs_in_shop_text = allowedCards.editions ?
                        (allowedCards.editions.includes(Constants.EDITIONS.CHAOS.ID, Constants.EDITIONS.RIFT.ID) ? '(or by buying more packs from the shop) ' : '') :
                        (allowedCards.sets.find(s => s.core === Constants.EDITIONS.CHAOS.ID) ? '(or by buying more packs from the shop) ' : '');
                    let alertMsg = player ?
                        `This ${eventType} is limited to: ${editionText}. It doesn't look like @${player} has enough such cards to participate (need at least 6 Monsters and 1 Summoner).` :
                        `This ${eventType} is limited to: ${editionText}. It doesn't look like you have enough such cards in your collection (need at least 6 Monsters and 1 Summoner). You can get more by purchasing them from other players on the market ${packs_in_shop_text}if you want to participate in these events in the future.`;
                    return {error: alertMsg};
                } else if (allowed_monsters < 20) {
                    let confirmMsg = player ?
                        `This ${eventType} is limited to: ${editionText}. It looks like @${player} may not have enough such cards to compete effectively. Are you sure you want to continue?` :
                        `This ${eventType} is limited to: ${editionText}. Please make sure you have enough such cards to participate. You can see what cards you have by clicking on a particular card on the collection screen and then choosing the edition icon in the top right of the card details popup. Are you sure you want to continue?`;
                    if (confirm(confirmMsg)) {
                        callback();
                        return;
                    }
                } else {
                    callback();
                    return;
                }
            } else {
                callback();
                return;
            }
        } else {
            callback();
        }
        return;
    }

    static constructTournamentAllowedEditionsText(editions, epoch, include_gladiators) {
        const gladiator_edition_name = splinterlands.utils.get_edition_str(6);
        const editionNames = [];
        let editionText = '';
        let allowed_editions = editions.slice(0);
        const max_edition_count = epoch === 'modern' ? splinterlands.get_settings().modern_num_editions : splinterlands.get_settings().num_editions;
        if (allowed_editions.length === 0) {
            if (epoch === 'modern') {
                allowed_editions = [2, 3, 4, 5, 7, 8, 10];
            } else {
                allowed_editions = [0, 1, 2, 3, 4, 5, 7, 8, 10];
            }
        }
        allowed_editions.forEach(edition => {
            if (edition !== 10) { // Don't push Soulbound reward text as it should just be reward cards
                let editionStr = splinterlands.utils.get_edition_str(edition);
                if (editionStr.toLowerCase() === "orb") {
                    editionStr = "Promo";
                } else if (editionStr.toLowerCase() === "chaos") {
                    editionStr = "Chaos Legion";
                } else if (editionStr.toLowerCase() === "rift") {
                    editionStr = "Riftwatchers";
                }

                editionNames.push(editionStr);
            }
        });
        if (allowed_editions.length === 0 || allowed_editions.length === max_edition_count) {
            if (include_gladiators) {
                editionText = `All Editions Allowed (plus ${gladiator_edition_name}!)`;
                editionNames.push(gladiator_edition_name);
            } else {
                editionText = 'All Editions Allowed';
            }
        } else {
            if (include_gladiators) {
                editionNames.push(gladiator_edition_name);
            }

            if (editionNames.length > 1) {
                editionText = editionNames.join(', ') + ' Editions Allowed';
            } else {
                editionText = editionNames[0] + ' Edition Only';
            }
        }

        return {editionNames, editionText};
    }

    static constructTournamentAllowedSetsText(sets, epoch, include_gladiators) {
        const gladiator_set_name = splinterlands.utils.get_edition_str(6);
        const editionNames = [];
        let editionText = '';
        let allowed_sets = sets.map((s) => s.core);
        const max_set_count = epoch === 'modern' ? 2 : splinterlands.get_settings().core_editions.length;
        if (allowed_sets.length === 0) {
            if (epoch === 'modern') {
                allowed_sets = splinterlands.get_settings().core_editions.slice(-2);
            } else {
                allowed_sets = splinterlands.get_settings().core_editions;
            }
        }
        allowed_sets.forEach(edition => {
            let editionStr = splinterlands.utils.get_edition_str(edition);
            if (editionStr.toLowerCase() === "orb") {
                editionStr = "Promo";
            } else if (editionStr.toLowerCase() === "chaos") {
                editionStr = "Chaos Legion";
            } else if (editionStr.toLowerCase() === "rift") {
                editionStr = "Riftwatchers";
            }
            editionNames.push(editionStr);
        });
        if (editionNames.length === 0 || editionNames.length === max_set_count) {
            if (include_gladiators) {
                editionText = `All ${epoch === 'modern' ? 'Modern ' : ''}Sets Allowed (plus ${gladiator_set_name}!)`;
                editionNames.push(gladiator_set_name);
            } else {
                editionText = epoch === 'modern' ? 'All Modern Sets Allowed' : 'All Sets Allowed';
            }
        } else {
            if (include_gladiators) {
                editionNames.push(gladiator_set_name);
            }

            if (editionNames.length > 1) {
                editionText = editionNames.join(', ') + ' Sets Allowed';
            } else {
                editionText = editionNames[0] + ' Set Only';
            }
        }

        return {editionNames, editionText};
    }

    static async submitEnterTournament(id, fee, signed_pw) {
        if (fee && splinterlands.utils.get_currency(fee) != 'DEC' && splinterlands.utils.get_currency(fee) != 'SPS' && splinterlands.utils.get_currency(fee) != 'VOUCHER') {
            let tx_id = 'sm_enter_tournament';

            if (splinterlands.get_settings().test_mode)
                tx_id = splinterlands.get_settings().prefix + tx_id;

            const currency = splinterlands.get_settings().supported_currencies.find(c => c.currency == splinterlands.utils.get_currency(fee));
            const memo = tx_id + ':' + id + ':' + splinterlands.get_player().name + ':' + signed_pw;

            if (currency.type == 'hive') {
                if (window.hive_keychain) {
                    hive_keychain.requestTransfer(splinterlands.get_player().name, splinterlands.get_settings().account, parseFloat(fee).toFixed(3), memo, currency.currency, function (response) {
                        if (!response.success) {
                            alert('Transaction not completed.');
                        }
                    });
                } else {
                    splinterlands.utils.hive_signer_payment(splinterlands.get_settings().account, parseFloat(fee), currency.currency, memo);
                }
            } else if (currency.type == 'hive_engine') {
                // Check that the player has a sufficient token balance in Hive Engine
                splinterlands.ssc_he.findOne('tokens', 'balances', {
                    symbol: currency.currency,
                    account: splinterlands.get_player().name
                }).then(response => {
                    if (!response || !response.balance || parseFloat(response.balance) < parseFloat(fee)) {
                        return {
                            success: false,
                            error: `You do not have enough ${currency.currency} tokens in your Hive Engine account to enter this tournament. Please go to hive-engine.com to pick some up!`
                        };
                    }

                    splinterlands.utils.hive_engine_transfer(splinterlands.get_settings().account, currency.currency, parseFloat(fee).toFixed(3), memo);
                });
            }
        } else {
            // Confirm the fee payment
            if (fee && !confirm(`This tournament has an entry fee of ${fee} which will be deducted from your balance. Do you want to continue?`)) {
                return;
            }

            if (parseFloat(fee) > 0) {
                await splinterlands.send_tx_wrapper(splinterlands.utils.get_currency(fee), splinterlands.get_settings().account, parseFloat(fee).toFixed(3), {
                    type: 'enter_tournament',
                    tournament_id: id,
                    signed_pw: signed_pw
                }, (r) => {
                    if (!r.success) splinterlands.HideLoading();
                });
            } else {
                let bat_event_list = splinterlands.get_settings().bat_event_list || [];
                let bat_settings = bat_event_list.find(e => e.id === id);
                if (bat_settings) {
                    try {
                        const params = await splinterlands.ethereum.web3Auth('Brave Tournament Entry');

                        // handle special BAT holding entry requirement
                        await splinterlands.ec_api('/players/bat_entry_check', Object.assign({
                            tournament_id: id,
                            signed_pw: signed_pw
                        }, params), (result) => {
                            if (!result || result.error) {
                                return result;
                            }
                        });
                    } catch (err) {
                        return `There was an error entering this tournament: ${err.message}`;
                    }
                } else {
                    await splinterlands.send_tx_wrapper('sm_enter_tournament', 'Enter Tournament', {
                        tournament_id: id,
                        signed_pw: signed_pw
                    }, (result) => {

                        if (result && !result.error && result.trx_info && result.trx_info.success)
                            return result;

                        if (result && result.error) {
                            return {error: `There was an error entering this tournament: ${result.error}`};
                        }
                    });
                }
            }
        }
    }

    static calculatePlayerTournamentPower(accountName, allowedCards, collection) {
        const maxEditionCount = allowedCards.epoch === 'modern' ? splinterlands.get_settings().modern_num_editions : splinterlands.get_settings().num_editions;
        const maxSetCount = allowedCards.epoch === 'modern' ? 2 : splinterlands.get_settings().core_editions.length;
        const isEditionRestricted =
            (allowedCards.editions && allowedCards.editions.length > 0 && allowedCards.editions.length < maxEditionCount) ||
            (allowedCards.sets && allowedCards.sets.length > 0 && allowedCards.sets.length < maxSetCount);
        let player_tournament_cp = 0;
        let gladiator_cp = 0; // we also keep track of this separately to help with debugging

        if (allowedCards.foil === 'all' && allowedCards.type === 'all' && !isEditionRestricted && allowedCards.epoch !== 'modern' && splinterlands.get_player() && accountName === splinterlands.get_player().name) {
            // if all cards allowed, then just use the player's pre-computed collection power
            player_tournament_cp = splinterlands.get_player().collection_power;
        } else {
            for (var card_type = 0; card_type < collection.length; card_type++) {
                var card_details = collection[card_type];
                if (card_details.rarity === 4 && (allowedCards.type === 'no_legendaries'
                    || (allowedCards.type === 'no_legendary_summoners' && card_details.type === 'Summoner'))) {
                    continue;
                }
                var owned = card_details.owned;
                if (owned && owned.length > 0) {
                    // doing this check here allows us to be more efficient and exclude some card types before we get to the below loop
                    var isModern = false;
                    if (allowedCards.epoch === 'modern') {
                        if (allowedCards.editions || !isEditionRestricted) {
                            isModern = splinterlands.is_card_in_modern_sets(owned[0].edition, card_details.tier, owned[0].card_detail_id);
                        } else if (allowedCards.sets && isEditionRestricted) {
                            isModern = splinterlands.is_card_in_sets(allowedCards.sets, owned[0].edition, card_details.tier, owned[0].card_detail_id);
                        }
                    }

                    if (allowedCards.epoch !== 'modern' || owned[0].edition === Constants.EDITIONS.GLADIUS.ID || isModern) {
                        for (var index = 0; index < owned.length; index++) {
                            var card = owned[index];
                            if ((card.market_id && card.market_listing_type == 'SELL') ||
                                card.uid.startsWith('starter-') ||
                                (card.delegated_to && card.delegated_to !== accountName) ||
                                (allowedCards.foil === 'gold_only' && !card.gold)) {
                                continue;
                            }

                            let card_cp = 0;
                            if (allowedCards.sets) {
                                // new set-centric way
                                if (!isEditionRestricted ||
                                    card.edition === Constants.EDITIONS.GLADIUS.ID ||
                                    (isEditionRestricted && allowedCards.epoch === 'modern') ||
                                    (isEditionRestricted && allowedCards.epoch !== 'modern' && splinterlands.is_card_in_sets(allowedCards.sets, card.edition, card_details.tier, card.card_detail_id))) {
                                    card_cp = calculateCP(card);
                                    player_tournament_cp += card_cp;
                                }
                            } else if (allowedCards.editions) {
                                // this editions based check is deprecated and left in only for backwards compatibility
                                if (!isEditionRestricted || card.edition === Constants.EDITIONS.GLADIUS.ID || (isEditionRestricted && allowedCards.editions.includes(card.edition))) {
                                    card_cp = calculateCP(card);
                                    player_tournament_cp += card_cp;
                                }
                            }

                            if (card.edition === Constants.EDITIONS.GLADIUS.ID) {
                                gladiator_cp += card_cp;
                            }
                        }
                    }
                }
            }

            console.log(`Gladiator Power: ${splinterlands.utils.add_commas(gladiator_cp)}`);
        }

        player_tournament_cp = Math.round(player_tournament_cp);
        console.log(`Total Tournament Power: ${splinterlands.utils.add_commas(player_tournament_cp)}`);
        return player_tournament_cp;
    }
}
