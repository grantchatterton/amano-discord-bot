class ServiceContainer {
	#services;

	constructor() {
		this.#services = new Map();
	}

	register(name, instance) {
		this.#services.set(name, instance);
	}

	resolve(name) {
		return this.#services.get(name);
	}
}

export default new ServiceContainer();
