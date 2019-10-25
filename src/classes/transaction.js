splinterlands.Transaction = class {
	constructor(data) {
		Object.keys(data).forEach(k => this[k] = data[k]);
		this.data = splinterlands.utils.try_parse(this.data);
    this.result = splinterlands.utils.try_parse(this.result);
	}
}