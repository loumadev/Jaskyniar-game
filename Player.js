class Player extends LivingEntity {
	constructor(options = {}) {
		super(options);

		//Overload values
		this.color = "#ffffff";
		this.char = "P";
		this.name = "Player";
		this.health = 1;
		this.strength = 0;

		this.inventory = [];
	}

	addToInventory(item) {
		this.inventory.push(item);
		this.dispatchEvent("inventorychange");
	}

	removeFromInventory(item) {
		this.inventory.splice(this.inventory.indexOf(item), 1);
		this.dispatchEvent("inventorychange");
	}

	pickup(item) {
		if(!(item instanceof Pickable)) throw new Error("Item is not pickable!");

		this.dispatchEvent("pickup", {item}, event => {
			this.inventory.push(event.item);
			this.dispatchEvent("inventorychange");
		});
	}
}