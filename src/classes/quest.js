splinterlands.Quest = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);

		this.created_date = new Date(this.created_date || 0);
		this.details = null
  }
  
  rewards(league_num) { return null; }

	get completed() { return true; }
	get claimed() { return true; }
	get next() { return 0; }
	get can_start() { return false; }
	get can_refresh() { return false; }

	async claim_rewards() { 
		console.log('Quests and claim_rewards has been deprecated')
		return false;
	}
	async start_quest() { 
		console.log('Quests and start_quest has been deprecated')
		return false;
	}
	async refresh_quest() { 
		console.log('Quests and refresh_quest has been deprecated')
		return false;
	}
}