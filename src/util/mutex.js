/**
 * A simple mutex (mutual exclusion) lock for synchronizing asynchronous operations.
 * Ensures that only one operation can hold the lock at a time, with additional
 * operations queued and executed in FIFO order. Useful for preventing race conditions
 * when multiple async operations need exclusive access to a shared resource.
 */
export class Mutex {
	/**
	 * Queue of pending resolve functions waiting to acquire the lock.
	 *
	 * @type {Array<() => void>}
	 */
	queue;

	/**
	 * Indicates whether the mutex is currently locked.
	 *
	 * @type {boolean}
	 */
	locked;

	/**
	 * Creates a new Mutex instance.
	 * The mutex starts in an unlocked state with an empty queue.
	 */
	constructor() {
		this.queue = [];
		this.locked = false;
	}

	/**
	 * Acquires the mutex lock. If the lock is already held, the caller is queued
	 * and the returned promise resolves when the lock becomes available.
	 * Always pair with a release() call, typically in a try-finally block to ensure
	 * the lock is released even if an error occurs.
	 *
	 * @returns {Promise<void>} A promise that resolves when the lock is acquired
	 * @example
	 * const mutex = new Mutex();
	 * await mutex.lock();
	 * try {
	 *   // Critical section - exclusive access
	 * } finally {
	 *   mutex.release();
	 * }
	 */
	lock() {
		return new Promise((resolve) => {
			if (this.locked) {
				this.queue.push(resolve);
			} else {
				this.locked = true;
				resolve();
			}
		});
	}

	/**
	 * Releases the mutex lock. If there are operations waiting in the queue,
	 * the next one is granted the lock. Otherwise, the mutex returns to an unlocked state.
	 * Should be called in a finally block to ensure the lock is always released.
	 *
	 * @returns {void}
	 */
	release() {
		if (this.queue.length > 0) {
			const resolve = this.queue.shift();
			resolve();
		} else {
			this.locked = false;
		}
	}
}
