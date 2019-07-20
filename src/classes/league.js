splinterlands.League = class {
	constructor(rating) {
		this.rating = rating;
	}

	get id() {
		if(this.rating < 100)
			return 0;

		if(this.rating >= 4700)
			return 15;

		if(this.rating >= 4200)
			return 14;

		if(this.rating >= 3700)
			return 13;

		return Math.min(parseInt((this.rating - 100) / 300) + 1, 15);
	}

	get level() {
		return Math.max(Math.min(Math.floor((this.id - 1) / 3) + 1, 4), 0);
	}

	get name() {
		var name = this.id < 4 ? 'Bronze' : (this.id < 7 ? 'Silver' : (this.id < 10 ? 'Gold' : (this.id < 13 ? 'Diamond' : 'Champion')));
		var tier = (this.id - 1) % 3;
		return name + ' ' + (tier == 0 ? 'III' : (tier == 1 ? 'II' : 'I'));
	}

	get image() {
		return `https://s3.amazonaws.com/steemmonsters/website/icons/leagues/league_${this.id}.png`;
	}
}