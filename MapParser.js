class MapParser {
	static parse(data) {
		const lines = data.split(/[\n\r]+/);

		//Calculate the size of the map
		const dimensions = new Dimensions(
			Math.max(...lines.map(e => e.length)),
			lines.length
		);
		const objects = [];

		for(let y = 0; y < lines.length; y++) {
			for(let x = 0; x < lines[y].length; x++) {
				const char = lines[y][x];
				const position = new Vector(x, y);

				//Parse each character as an object
				if(char === "#") {
					objects.push(new Wall({position}));
				} else if(char === "X") {
					objects.push(new Exit({position}));
				} else if(char === "P") {
					objects.push(new Monster({position}));
				} else if(char === "A") {
					objects.push(new Arrow({position}));
				} else if(char === "S") {
					objects.push(new Player({position}));
				}
			}
		}

		//Create a new map
		const map = new GameMap({dimensions, objects});
		map.spawn = map.getPlayer().position.copy();

		//Validate the map
		this.validateMap(map);

		return map;
	}

	static validateMap(map) {
		const exitSearch = map.search(map.spawn, Exit);

		if(!exitSearch.found) console.warn("No reachable exit found!");
	}
}