const REACH_LIMIT = 1000;

class GameMap extends EventListener {
	constructor(options = {}) {
		super();

		const {
			dimensions,
			objects
		} = options;

		this.dimensions = dimensions;
		this.objects = objects;
		this.spawn = null;
	}

	getLivingEntities() {
		return this.objects.filter(object => object instanceof LivingEntity);
	}

	getMonsters() {
		return this.objects.filter(object => object instanceof Monster);
	}

	getArrows() {
		return this.objects.filter(object => object instanceof Arrow);
	}

	getWalls() {
		return this.objects.filter(object => object instanceof Wall);
	}

	getExits() {
		return this.objects.filter(object => object instanceof Exit);
	}

	getPlayer() {
		return this.objects.find(object => object instanceof Player);
	}

	getObject(position) {
		if(!(position instanceof Vector)) throw new Error("Position must be a Vector");

		return this.objects.find(object => object.position.isEqual(position));
	}

	addObject(object) {
		if(!(object instanceof MapObject)) throw new Error("Cannot move non-map object");

		this.dispatchEvent("objectadd", {object}, event => {
			this.objects.push(object);
			this.dispatchEvent("update");
		});
	}

	moveObjectTo(object, position) {
		if(!(object instanceof MapObject)) throw new Error("Cannot move non-map object");
		if(!(position instanceof Vector)) throw new Error("Position must be a Vector");

		const targetObject = this.getObject(position);

		const move = () => {
			this.dispatchEvent("move", {
				from: object,
				to: targetObject
			}, event => {
				object.position = position;
				this.dispatchEvent("update");
			});
		};

		if(targetObject) {
			this.dispatchEvent("collision", {
				collider1: object,
				collider2: targetObject
			}, event => {
				move();
			});
		} else {
			move();
		}
	}

	moveObjectBy(object, direction) {
		if(!(object instanceof MapObject)) throw new Error("Cannot move non-map object");
		if(!(direction instanceof Vector)) throw new Error("Position must be a Vector");

		const newPosition = object.position.copy().add(direction);
		this.moveObjectTo(object, newPosition);
	}

	destroyObject(object) {
		if(!(object instanceof MapObject)) throw new Error("Cannot move non-map object");

		this.dispatchEvent("destroy", {object}, event => {
			this.objects.splice(this.objects.indexOf(object), 1);
			this.dispatchEvent("update");
		});
	}

	find(position, callback) {
		if(!(position instanceof Vector)) throw new Error("Position must be a Vector");
		if(typeof callback !== "function") throw new Error("Callback must be a function");

		const location = {
			position: position,
			path: [],
			found: false
		};

		const visited = [];
		const queue = [location];

		//Queue based Flood-fill algorithm
		while(queue.length > 0) {
			const currentLocation = queue.shift();
			const object = this.getObject(currentLocation.position);

			if(object instanceof Wall) continue;

			const called = object && callback(object);

			if(!object || !called || called == 0) {
				for(const direction of DIRECTIONS) {
					const newPosition = currentLocation.position.copy().add(direction);
					const newPath = currentLocation.path.slice();

					const newLocation = {
						position: newPosition,
						path: newPath,
						found: false
					};
					newPath.push(newPosition);

					if(!visited.some(e => e.isEqual(newPosition))) {
						queue.push(newLocation);
						visited.push(newLocation.position);
					}
				}
			} else if(called == 1) {
				currentLocation.found = true;
				return currentLocation;
			}
		}

		return location;
	}

	search(position, type) {
		if(!(position instanceof Vector)) throw new Error("Position must be a Vector");
		if(!Utils.subclassOf(type, MapObject)) throw new Error("Type must be a MapObject");

		return this.find(position, object => object instanceof type);
	}

	getReachable(position, type) {
		if(!(position instanceof Vector)) throw new Error("Position must be a Vector");
		if(!Utils.subclassOf(type, MapObject)) throw new Error("Type must be a MapObject");

		const found = [];
		let len = 0;
		let i = 0;

		do {
			this.find(position, object => {
				const isType = object instanceof type;
				if(isType && !found.includes(object)) found.push(object);
				if(isType) return -1;
				return 0;
			});
		} while((len != found.length) && (len = found.length) && (i++ < REACH_LIMIT));

		return found;
	}

	clone() {
		const objects = this.objects.map(object => object.clone());
		const map = new GameMap({
			dimensions: this.dimensions.copy(),
			objects: objects
		});

		map.spawn = this.spawn;

		return map;
	}
}