class PlayerController extends EventListener {
	constructor(game, options = {}) {
		super();

		const {
			useExternalInput = true
		} = options;

		this.game = game;
		this.useExternalInput = useExternalInput;
		this.activeKeys = [];

		if(this.useExternalInput) {
			this.initInput();
		}
	}

	initInput() {
		document.addEventListener("keydown", e => {
			const key = e.keyCode || e.which;

			//Prevent repeating event when holding key
			if(this.activeKeys.includes(key)) return;
			this.activeKeys.push(key);

			if(!this.game.isRunning) return;

			let direction = null;

			//Direction selection
			if(key === 38 || key === 87) { //Up
				direction = new Vector(0, -1);
			} else if(key === 40 || key === 83) { //Down
				direction = new Vector(0, 1);
			} else if(key === 37 || key === 65) { //Left
				direction = new Vector(-1, 0);
			} else if(key === 39 || key === 68) { //Right
				direction = new Vector(1, 0);
			}

			//Action selection
			if(key !== 32 && this.activeKeys.includes(32)) { //Space
				this.shoot(direction);
			} else if(direction) {
				this.move(direction);
			}

			//Navigation
			if(key === 49) { //1
				console.log("Locate: Arrow");
				this.locate(Arrow);
			} else if(key === 50) { //2
				this.locate(Monster);
			} else if(key === 51) { //3
				this.locate(Exit);
			}
		});

		document.addEventListener("keyup", e => {
			this.activeKeys = this.activeKeys.filter(key => key !== (e.keyCode || e.which));
		});
	}

	move(direction) {
		if(!(direction instanceof Vector)) throw new Error("Direction must be a Vector");

		const player = this.game.map.getPlayer();
		this.game.map.moveObjectBy(player, direction);
	}

	moveTo(position) {
		if(!(position instanceof Vector)) throw new Error("Position must be a Vector");

		const player = this.game.map.getPlayer();
		this.game.map.moveObjectTo(player, position);
	}

	shoot(direction) {
		if(!(direction instanceof Vector)) throw new Error("Direction must be a Vector");

		this.dispatchEvent("shoot", {direction});
	}

	locate(type) {
		if(!Utils.subclassOf(type, MapObject)) throw new Error("Type must be a MapObject");

		if(this.game.navigation.locating === type) this.game.navigation.toggleOff();
		else this.game.navigation.locate(type);
	}
}