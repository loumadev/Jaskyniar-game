const RENDER_FALLBACK_CHAR = ".";
const RENDER_EMPTY_CHAR = " ";
const RENDER_MODE = {
	BASIC: "basic",
	RAYCAST: "raycast"
};
const SIGHT_RADIUS = 20;

class Renderer {
	constructor(game, options = {}) {
		const {
			renderDistance = 8,
			alwaysDrawWalls = true,
			viewDistance = 3,
			drawRays = false,
			renderMode = RENDER_MODE.BASIC,
			colors = true,
			canvas,
			enabled = true
		} = options;

		this.game = game;
		this.renderDistance = renderDistance;
		this.alwaysDrawWalls = alwaysDrawWalls;
		this.viewDistance = viewDistance;
		this.drawRays = drawRays;
		this.renderMode = renderMode;
		this.colors = colors;
		this.enabled = enabled;
		this.canvas = canvas;
	}

	renderFrame() {
		//Do not render once the game ended or the renderer is disabled
		if(!this.game.isRunning || !this.enabled) return;

		//render the frame using the selected render mode
		if(this.renderMode === RENDER_MODE.BASIC) {
			this.basicRender();
		} else if(this.renderMode === RENDER_MODE.RAYCAST) {
			this.raycastRender();
		} else {
			throw new Error("Invalid render mode");
		}
	}

	basicRender() {
		const player = this.game.map.getPlayer();
		const view = this.renderDistance;

		//Loop all the positions in the view range relative to the origin of the player
		let frame = "";
		for(let y = player.position.y - view; y <= player.position.y + view; y++) {
			for(let x = player.position.x - view; x <= player.position.x + view; x++) {
				const position = new Vector(x, y);
				const object = this.game.map.getObject(position);

				frame += this.drawObject(object) || this.drawRays && RENDER_FALLBACK_CHAR || RENDER_EMPTY_CHAR;
			}

			frame += "\n";
		}
		this.canvas.innerHTML = frame;
	}

	raycastRender() {
		const player = this.game.map.getPlayer();
		const view = this.renderDistance;
		const screen = this.raycast(player.position);

		//Screen now contains all the objects in the view range, so just draw them to the frame applying the specified rules (options)
		let frame = "";
		for(let y = player.position.y - view; y <= player.position.y + view; y++) {
			for(let x = player.position.x - view; x <= player.position.x + view; x++) {
				const position = new Vector(x, y);
				const object = this.game.map.getObject(position);
				const raycasted = screen[y] && screen[y][x];

				if(this.alwaysDrawWalls && object instanceof Wall) frame += this.drawObject(object);
				else if(player.position.distanceTo(position) <= this.viewDistance) frame += raycasted || RENDER_EMPTY_CHAR;
				else frame += RENDER_EMPTY_CHAR;
			}

			frame += "\n";
		}
		this.canvas.innerHTML = frame;
	}

	drawObject(object) {
		if(!object) return null;

		return `<span style="color: ${this.colors ? object.color : "inherit"}">${object.char}</span>`;
	}

	raycastArc(origin, screen, rotate, distance = 0, min = -1, max = 1) {
		const radius = this.viewDistance * 2 + 1;

		//We're finished scanning either when the distance is too far or when the angle between the two ends of the arc is 0 
		if(distance >= radius || min >= max) return;

		//Iterate over all integers between min and max
		for(var i = Math.ceil(distance * min); i <= distance * max; i++) {
			//(distance, i) forms an offset from the player representing our current cell
			//We rotate it by a multiple of 90 degrees so we can scan in 4 directions
			const position = new Vector(
				origin.x + rotate(distance, i).x,
				origin.y + rotate(distance, i).y
			);

			//If our line of sight is blocked, recursively scan at depth + 1 to the side of the block
			const object = this.game.map.getObject(position);
			if(object instanceof Wall) {
				this.raycastArc(origin, screen, rotate, distance + 1, min, (i - 0.5) / distance);
				min = (i + 0.5) / distance;
			}

			if(screen[position.y]) screen[position.y][position.x] = this.drawObject(object) || this.drawRays && RENDER_FALLBACK_CHAR || RENDER_EMPTY_CHAR;
		}

		//When we finish scanning a row, continue by scanning the next row
		this.raycastArc(origin, screen, rotate, distance + 1, min, max);
	}

	raycast(position) {
		//Allocate a screen buffer
		const view = this.renderDistance;
		const screen = Array(view * 2 + 1).fill().map(() => Array(view * 2 + 1));

		//Send rays in all 4 directions
		this.raycastArc(position, screen, (x, y) => new Vector(x, y));
		this.raycastArc(position, screen, (x, y) => new Vector(y, -x));
		this.raycastArc(position, screen, (x, y) => new Vector(-x, -y));
		this.raycastArc(position, screen, (x, y) => new Vector(-y, x));

		return screen;
	}
}