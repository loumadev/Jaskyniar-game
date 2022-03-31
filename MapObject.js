class MapObject extends EventListener {
	constructor(options = {}) {
		super();

		const {
			char,
			color,
			position = new Vector()
		} = options;

		this.char = char;
		this.color = color;
		this.position = position;
	}

	clone() {
		const object = new this.constructor({
			char: this.char,
			color: this.color,
			position: this.position.copy()
		});

		Utils.deepClone(this, object);

		return object;
	}
}

class Pickable extends MapObject {
	constructor(options = {}) {
		super(options);

		this.name = "Pickable";
	}
}

class Exit extends MapObject {
	constructor(options = {}) {
		super(options);

		this.color = "#00ff00";
		this.char = "X";
	}
}

class Solid extends MapObject {
	constructor(options = {}) {
		super(options);
	}
}

class Wall extends Solid {
	constructor(options = {}) {
		super(options);

		this.color = "#858585";
		this.char = "#";
	}
}

class Arrow extends Pickable {
	constructor(options = {}) {
		super(options);

		this.name = "Arrow";
		this.color = "#fff255";
		this.char = "A";
	}
}

class LivingEntity extends Solid {
	constructor(options = {}) {
		super(options);

		const {
			name,
			health,
			strength
		} = options;

		this.name = name;
		this.health = health;
		this.strength = strength;
	}

	damage(attacker, amount = attacker.strength) {
		this.dispatchEvent("damage", {attacker, amount}, event => {
			this.health -= event.amount;

			if(this.health <= 0) {
				this.dispatchEvent("death", {attacker});
			}
		});
	}
}

class Monster extends LivingEntity {
	constructor(options = {}) {
		super(options);

		this.color = "#ff0000";
		this.char = "M";
		this.name = "Monster";
		this.health = 1;
		this.strength = 1;
	}
}