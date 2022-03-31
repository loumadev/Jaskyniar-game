const NAVIGATION_MODE = {
	ROUTE: 1,
	DIRECTION: 2
};

class NavigationMark extends MapObject {
	constructor(options = {}) {
		super(options);

		this.color = "#d56fff";
		this.char = "*";
	}
}

class Navigation extends EventListener {
	constructor(game, options = {}) {
		super();

		const {
			mode = NAVIGATION_MODE.ROUTE
		} = options;

		this.game = game;
		this.mode = mode;

		this.locating = null;

		this.game.on("init", e => {
			//If there is an update to the map, update the navigation as well
			this.game.map.on("update", e => {
				if(!this.game.isRunning) return;
				if(this.locating) this.locate(this.locating);
			});
		});
	}

	locate(type) {
		if(!Utils.subclassOf(type, MapObject)) throw new Error("Type must be a MapObject");

		//Find the path to the object
		const result = this.game.map.find(this.game.map.getPlayer().position, object => {
			if(object instanceof type) return 1;
			if(object instanceof Player) return 0;
			if(object instanceof Solid) return -1;
			return 0;
		});

		//Clear the previous navigation marks
		this.clearMap();
		this.dispatchEvent("update", {type, result});

		if(result.found) {
			//Create the navigation marks
			if(this.mode === NAVIGATION_MODE.DIRECTION) {
				this.markDirection(result.path);
			} else if(this.mode === NAVIGATION_MODE.ROUTE) {
				this.highlightRoute(result.path);
			}

			this.locating = type;
			this.dispatchEvent("navigate", {type, result});

			return true;
		} else {
			//No path to the object found
			this.locating = null;
			this.dispatchEvent("unreachable", {type, result});

			return false;
		}
	}

	clearMap() {
		this.game.map.objects = this.game.map.objects.filter(object => !(object instanceof NavigationMark));
		this.game.renderer.renderFrame();
	}

	highlightRoute(path) {
		//Loop all the path positions and create a NavigationMark for each one
		for(const position of path) {
			const mark = new NavigationMark({position: position});
			this.game.map.objects.push(mark);
		}
		this.game.renderer.renderFrame();
	}

	markDirection(path) {
		//Pick just the first position in the path and highlight the direction
		this.highlightRoute(path.slice(0, 1));
	}

	toggleOff() {
		this.locating = null;
		this.clearMap();
		this.dispatchEvent("update", {type: null, result: null});
	}
}