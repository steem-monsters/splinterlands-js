splinterlands.Market = class {
	static async for_sale_by_card(card_detail_id, is_gold, edition) { 
        let market_cards = await splinterlands.api('/market/for_sale_by_card', { card_detail_id, gold: is_gold, edition });
		return market_cards.map(c => new splinterlands.MarketCard(c));
    }

    static async for_sale_grouped() { 
        let market_cards_grouped = await splinterlands.api('/market/for_sale_grouped');
		return market_cards_grouped.map(c => new splinterlands.MarketCardGrouped(c));
    }

    static async purchase(market_ids, price, currency) { 
		let womplay_id = await splinterlands.get_player().get_womplay_id();
		if(womplay_id) {
			await splinterlands.ec_api("/womplay/tracking", { womplay_id, event_name: "purchased_card_on_market"  });				
		}

        let tx = await splinterlands.ops.market_purchase(market_ids, price, currency);
        return tx;
    }

    static async volume_24H() { 
        return await splinterlands.api('/market/volume');
    }
}

splinterlands.MarketCard = class extends splinterlands.Card {
	constructor(data) {
		super(data);
	}
}

splinterlands.MarketCardGrouped = class extends splinterlands.Card {
	constructor(data) {
		super(data);
	}
}