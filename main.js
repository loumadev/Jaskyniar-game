const playGame = (async function(options = {}) {
	const game = new Game({
		//mapFile: "./maps/5.map",
		mapFile: "./maps/test_6.map",
		renderOptions: {
			renderDistance: 9,
			//renderMode: RENDER_MODE.BASIC,
			renderMode: RENDER_MODE.RAYCAST,
			viewDistance: 3,
			alwaysDrawWalls: false,
			drawRays: false,
			color: true,
			canvas: JL("pre.canvas.main"),
			enabled: true
		},
		inputOptions: {
			useExternalInput: true
		},
		navigationOptions: {
			mode: NAVIGATION_MODE.DIRECTION
		},
		...options
	});

	const ui = new UI({
		game: game,
		element: JL(".ui")
	});

	game.init();

	window.game = game;
	console.log(game);

	return game;
});

const trainAI = (async function(options = {}) {
	let gen = 0;

	const model = await fetch("./models/map1.json").then(res => res.json());

	function newGeneration(network = null) {
		const previewGame = new Game({
			mapFile: "./maps/2.map",
			//mapFile: "./maps/test_1.map",
			renderOptions: {
				renderDistance: 16,
				renderMode: RENDER_MODE.BASIC,
				//renderMode: RENDER_MODE.RAYCAST,
				viewDistance: 3,
				alwaysDrawWalls: false,
				drawRays: false,
				canvas: JL("pre.canvas.main"),
				enabled: true
			},
			inputOptions: {
				useExternalInput: false
			},
			...options
		});

		previewGame.on("init", () => {
			gen++;

			const games = [];
			let interval = null;

			//Create a new generation
			for(let i = 0; i < 600; i++) {
				const game = new Game({
					mapData: previewGame.mapData,
					//mapFile: "./maps/test_1.map",
					renderOptions: {
						renderDistance: 9,
						renderMode: RENDER_MODE.BASIC,
						//renderMode: RENDER_MODE.RAYCAST,
						viewDistance: 3,
						alwaysDrawWalls: false,
						drawRays: true,
						enabled: false
					},
					inputOptions: {
						useExternalInput: false
					}
				});

				game._AIPlayer = new PlayerAI(game, {});
				games.push(game);

				if(network) game._AIPlayer.mutate(network);

				game.on("end", e => {
					if(e.result === "lose") {
						game._AIPlayer.died = true;
					} else {
						clearInterval(interval);
						console.log("WINNER !");
						console.log(game._AIPlayer.network.save());
					}
					//console.log("Game ended!", e.result);
					//console.log(game._AIPlayer);
				});
				game.init();
			}

			//Copy all players into preview game
			games.forEach(game => previewGame.map.addObject(game.map.getPlayer()));

			//Game loop
			const maxSteps = previewGame.map.search(previewGame.map.spawn, Exit).path.length + 1;
			let steps = 0;
			interval = setInterval(() => {
				for(const game of games) {
					const AI = game._AIPlayer;
					if(AI.died) continue;

					const direction = AI.predictMovement();
					game.controller.move(direction);
				}

				steps++;
				previewGame.renderer.renderFrame();

				if(steps >= Math.min(10 + gen, maxSteps)) {
					clearInterval(interval);
					console.log("Reached max steps!");

					//calculate fitness (distance to exit)
					for(const game of games) {
						const AI = game._AIPlayer;
						if(AI.died) AI.fitness;

						AI.fitness = AI.calculateFitness();
					}

					//sort by fitness
					games.sort((a, b) => b._AIPlayer.fitness - a._AIPlayer.fitness);

					console.log(games[0]._AIPlayer.fitness);

					//create new generation
					newGeneration(games[0]._AIPlayer.network);
				}
			}, 0);

			console.log("Generation:", gen);

		});
		previewGame.init();
	}

	newGeneration(/*NeuralNetwork.load(model)*/);

	//window.game = previewGame;
	//console.log(previewGame);
});

const useAIv2 = (async function(options = {}) {
	const game = new Game({
		//mapFile: "./maps/5.map",
		//mapFile: "./maps/test_8.map",
		mapFile: "./maps/test_debug_0.map",
		renderOptions: {
			renderMode: RENDER_MODE.BASIC,
			//renderMode: RENDER_MODE.RAYCAST,
			renderDistance: 16,
			viewDistance: 3,
			alwaysDrawWalls: false,
			drawRays: false,
			color: true,
			canvas: JL("pre.canvas.main"),
			enabled: true
		},
		inputOptions: {
			useExternalInput: false
		},
		...options
	});

	const AIPlayer = new PlayerAIv2(game, {
		computeOptions: {
			delay: options._renderHelper ? options._ai_delay_main || 0 : 0,
			renderHelper: options._renderHelper || false
		}
	});

	const ui = new UI({
		game: game,
		element: JL(".ui"),
		AIPlayer: AIPlayer
	});

	game.init();

	window.game = game;
	console.log(game);

	return game;
});

const buildOptions = (function() {
	const options = {
		renderOptions: {},
		inputOptions: {},
		navigationOptions: {},
	};

	options._playerMode = JL("#playerMode").value;
	options._ai_delay_main = JL("#ai_delay_main").value;
	options._renderHelper = JL("#renderHelper").checked;

	options.mapFile = "./maps/" + JL("#mapFile").value;

	options.renderOptions.renderMode = JL("#renderMode").value;
	options.renderOptions.renderDistance = parseInt(JL("#renderDistance").value);
	options.renderOptions.viewDistance = parseInt(JL("#viewDistance").value);
	options.renderOptions.alwaysDrawWalls = JL("#alwaysDrawWalls").checked;
	options.renderOptions.drawRays = JL("#drawRays").checked;
	options.renderOptions.colors = JL("#color").checked;
	options.renderOptions.canvas = JL(".canvas.main");

	options.navigationOptions.mode = parseInt(JL("#navigationMode").value);

	return options;
});

(function main() {
	//return trainAI();
	//return useAIv2();
	//return playGame();

	JL("#start").onclick = e => {
		const options = buildOptions();
		console.log(options);

		if(window.game && window.game.isRunning) {
			console.log("Stopping currently running game!");
			window.game.endGame("interrupt");
			window.game = null;
		}

		JL(".log").innerHTML = "";
		JL(".helper-games").innerHTML = "";

		if(options._playerMode === "player") {
			playGame(options);
		} else if(options._playerMode === "ai_agent_v1") {
			trainAI(options);
		} else if(options._playerMode === "ai_agent_v2") {
			useAIv2(options);
		}
	};
})();