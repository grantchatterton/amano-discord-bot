export class Mutex {
	constructor() {
		this.queue = [];
		this.locked = false;
	}

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

	release() {
		if (this.queue.length > 0) {
			const resolve = this.queue.shift();
			resolve();
		} else {
			this.locked = false;
		}
	}
}
