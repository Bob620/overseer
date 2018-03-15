class ServiceInstance {
	constructor(service, defaultSettings) {
		this.Service = service;
		this.defaultSettings = defaultSettings;
	}

	create(settings=this.defaultSettings) {
		return new this.Service(settings);
	}
}