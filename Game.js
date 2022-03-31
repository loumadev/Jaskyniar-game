const ARROW_HIT_DAMAGE = 1;
const ARROW_REACH = 10;
const DIRECTIONS = [
	new Vector(1, 0),
	new Vector(0, 1),
	new Vector(-1, 0),
	new Vector(0, -1),
];

class Game extends EventListener {
	constructor(options = {}) {
		super();

		const {
			mapFile,
			mapData,
			renderOptions = {},
			inputOptions = {},
			navigationOptions = {}
		} = options;

		this.mapFile = mapFile;
		this.mapData = mapData;
		this.renderOptions = renderOptions;
		this.inputOptions = inputOptions;
		this.navigationOptions = navigationOptions;

		//Internal properties
		this.controller = null;
		this.renderer = null;
		this.navigation = null;
		this.map = null;
		this.isRunning = false;
	}

	async init() {
		//Init the map
		if(!this.mapData) this.mapData = await this.loadMap(this.mapFile);
		else if(!this.map) this.map = MapParser.parse(this.mapData);

		//Create internal modules
		this.controller = new PlayerController(this, this.inputOptions);
		this.renderer = new Renderer(this, this.renderOptions);
		this.navigation = new Navigation(this, this.navigationOptions);

		//Setup listeners
		this.setupObjectCollider();
		this.setupPlayerListeners();

		//Update the frame when the map changes
		this.map.on("update", e => {
			this.renderer.renderFrame();
		});

		this.isRunning = true;
		this.renderer.renderFrame();
		this.dispatchEvent("init");
	}

	setupObjectCollider() {
		this.map.on("collision", e => {
			//Coliding with solid object
			if(e.collider2 instanceof Solid) {
				e.preventDefault();
			}

			//Living entity colliding with monster
			if(e.collider1 instanceof LivingEntity && e.collider2 instanceof Monster) {
				e.collider1.damage(e.collider2);
			}

			if(e.collider1 instanceof Player) {
				//Player entering the Exit
				if(e.collider2 instanceof Exit) {
					this.endGame("win");
				}

				//Player collecting a pickable item
				if(e.collider2 instanceof Pickable) {
					e.collider1.pickup(e.collider2);
					this.map.destroyObject(e.collider2);
				}
			}
		});
	}

	setupPlayerListeners() {
		const player = this.map.getPlayer();

		//Handling player dying
		player.on("death", e => {
			this.endGame("lose");
		});

		//Shooting mechanic
		this.controller.on("shoot", e => {
			const arrow = player.inventory.find(item => item instanceof Arrow);

			//Prevent shooting if there are no arrows in the inventory
			if(!arrow) return;

			//Remove the arrow from the inventory
			player.removeFromInventory(arrow);

			//Damage the LivingEntity that is in the direction of the arrow
			const position = player.position.copy();
			for(let i = 0; i < ARROW_REACH; i++) {
				position.add(e.direction);

				const object = this.map.getObject(position);

				//Damage the LivingEntity
				if(object instanceof LivingEntity) {
					object.damage(player, ARROW_HIT_DAMAGE);
					break;
				}

				//Hitting the solid object will stop the arrow
				if(object instanceof Solid) {
					break;
				}
			}
		});

		//Removing the living entity from the map once it dies
		this.map.getLivingEntities().forEach(entity => {
			entity.on("death", e => {
				this.map.destroyObject(entity);
			});
		});
	}

	endGame(result) {
		this.isRunning = false;
		this.dispatchEvent("end", {result});
	}

	clone() {
		const game = new Game({
			mapFile: this.mapFile,
			mapData: this.mapData,
			renderOptions: Utils.deepClone(this.renderOptions),
			inputOptions: Utils.deepClone(this.inputOptions),
		});

		game.map = this.map.clone();

		return game;
	}

	async loadMap(path) {
		const map = await fetch(path).then(res => res.text());

		this.map = MapParser.parse(map);
		return map;
	}
}