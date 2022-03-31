class UI {
	constructor(options = {}) {
		const {
			game,
			element,
			AIPlayer = null
		} = options;

		this.game = game;
		this.element = element;
		this.AIPlayer = AIPlayer;

		if(this.AIPlayer) {
			this.log("Using internal input hooked to AI outputs.");

			let date = null;

			this.AIPlayer.on("computestart", e => {
				date = Date.now();
				this.log("Computing route...");
			});
			this.AIPlayer.on("computefinish", e => {
				this.log(`Computing finished (${Date.now() - date}ms)`);
			});
			this.AIPlayer.on("fail", e => {
				this.log(`AI failed: ${e.reason}`);
			});
		} else {
			this.log("Using external input.");
			this.log("Press arrow keys to move, space + arrow to shoot; or WASD alternatively.");
			this.log("Press alphanumeric keys 1-3 for toggling the navigation.");
		}

		this.game.on("init", e => {
			this.setupEventListeners();
		});
	}

	setupEventListeners() {
		const player = this.game.map.getPlayer();

		player.on("inventorychange", e => {
			this.updateInventory(player);
		});

		this.game.map.on("update", e => {
			this.updateStats();
		});

		this.game.navigation.on("update", e => {
			this.updateNavigation(e);
		});

		this.game.navigation.on("unreachable", e => {
			this.log(`Navigation to ${e.type.name} failed: Destination is unreachable.`);
		});

		this.game.on("end", e => {
			this.log(`Game ended: ${e.result}`);
			//this.log(`Press Ctrl+R to restart.`);
		});

		this.updateInventory(player);
		this.updateStats();
		this.updateNavigation();
	}

	updateInventory(player = this.game.map.getPlayer()) {
		const html = player.inventory.map(item => `<div class="item">
			<span>${item.name}</span>
		</div>`).join(", ");
		JL(this.element, ".inventory").innerHTML = `Inventory: [ ${html} ]`;
	}

	updateStats() {
		JL(this.element, ".monsters").innerText = `Monsters: ${this.game.map.getMonsters().length}`;
		JL(this.element, ".arrows").innerText = `Arrows: ${this.game.map.getArrows().length}`;
	}

	updateNavigation(event = {}) {
		JL(this.element, ".navigation").innerText = `Navigation: ${event.result && event.result.found ? `${event.type.name} (${event.result.path.length})` : "none"}`;
	}

	log(message) {
		JL(this.element, ".log").innerHTML += message + "<br>";
	}
}