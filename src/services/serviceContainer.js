/**
 * A singleton service container for dependency injection.
 * Provides a centralized registry for application services, allowing
 * services to be registered once during initialization and resolved
 * throughout the application. Uses a simple key-value Map for service storage.
 */
class ServiceContainer {
	/**
	 * Map storing registered service instances.
	 * Keys are service names (strings), values are service instances.
	 *
	 * @type {Map<string, any>}
	 */
	#services;

	/**
	 * Creates a new ServiceContainer instance.
	 * Note: This constructor is only called once for the singleton export.
	 */
	constructor() {
		this.#services = new Map();
	}

	/**
	 * Registers a service instance with a given name.
	 * If a service with the same name already exists, it will be replaced.
	 * Should be called during application initialization before any services are resolved.
	 *
	 * @param {string} name - The unique name to identify this service
	 * @param {any} instance - The service instance to register
	 * @returns {void}
	 */
	register(name, instance) {
		this.#services.set(name, instance);
	}

	/**
	 * Resolves and retrieves a registered service by name.
	 * Returns undefined if the service has not been registered.
	 * Should be called outside try-catch blocks to fail fast on configuration errors.
	 *
	 * @param {string} name - The name of the service to resolve
	 * @returns {any} The registered service instance, or undefined if not found
	 */
	resolve(name) {
		return this.#services.get(name);
	}
}

/**
 * Singleton instance of the ServiceContainer.
 * Import this instance throughout the application to access registered services.
 *
 * @type {ServiceContainer}
 */
export default new ServiceContainer();
