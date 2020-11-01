splinterlands.Market = class {
	static async load_market_cards(card_detail_id, is_gold, edition) { 
        let market_cards = await splinterlands.api('/market/for_sale_by_card', { card_detail_id, gold: is_gold, edition });
		return market_cards.map(c => new splinterlands.MarketCard(c));
    }

    static async purchase(market_ids, price, currency) { 
        let tx = await splinterlands.ops.market_purchase(market_ids, price, currency);
        return tx;
    }
}

splinterlands.MarketCard = class extends splinterlands.Card {
	constructor(data) {
		super(data);
	}
}