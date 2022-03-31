class Utils {
	static direction(vector1, vector2) {
		return vector1.copy().sub(vector2);
	}

	static deepClone(source, destination = undefined, values = []) {
		//Literal values
		if(typeof source !== "object" || source === null) return source;
		else if(!destination) {
			destination = {};
		}

		if(values.includes(source)) return source;

		for(const key in source) {
			if(["on", "listeners"].indexOf(key) === -1) {
				const value = source[key];
				values.push(value);

				if(typeof value === "object" && value !== null) {
					if(typeof value.clone === "function") {
						destination[key] = value.clone();
					} else if(typeof value.copy === "function") {
						destination[key] = value.copy();
					} else if(value instanceof Array) {
						destination[key] = value.map(e => {
							if(typeof e.clone === "function") {
								return e.clone();
							} else if(typeof e.copy === "function") {
								return e.copy();
							} else return Utils.deepClone(e);
						});
					} else {
						destination[key] = Utils.deepClone(value, undefined, values);
					}
				} else destination[key] = value;
			}
		}

		return destination;
	}

	static subclassOf(a, b) {
		return a && (a.prototype instanceof b || a === b);
	}
}