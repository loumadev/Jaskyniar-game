const STEP = {
	MOVE: 1,
	SHOOT: 2
};

class PlayerAIv2 extends EventListener {
	constructor(game, options = {}) {
		super();

		const {
			delay = 200,
			computeOptions = {}
		} = options;

		//Apply default values to computeOption
		{
			const {
				delay = 0,
				renderHelper = false,
				queueLoopLimit = 1000,
				debug = false
			} = computeOptions;

			this.computeOptions = {
				delay,
				renderHelper,
				queueLoopLimit,
				debug
			};
		}

		this.game = game;
		this.delay = delay;

		//Wait for the game to initialize
		this.game.on("init", async e => {
			if(this._isClone) return;

			this.dispatchEvent("computestart");
			const steps = await this.generateSteps();
			this.dispatchEvent("computefinish", {steps});

			this.log({finalSteps: steps});

			for(const step of steps) {
				if(step.type === STEP.MOVE) this.game.controller.moveTo(step.direction);
				if(step.type === STEP.SHOOT) this.game.controller.shoot(step.direction);

				await timeout(this.delay);
			}
		});
	}

	log(...message) {
		if(this.computeOptions.debug) console.log(...message);
	}

	cloneGame(gameToClone = this.game) {
		//Create a clone of the game and new AI agent
		const game = gameToClone.clone();
		const AIPlayer = new PlayerAIv2(game, {
			delay: this.computeOptions.delay,
			computeOptions: this.computeOptions
		});

		//Mark a new AI agent as a clone
		AIPlayer._isClone = true;

		//Setup the rendering options
		if(this.computeOptions.renderHelper) {
			const canvas = document.createElement("pre");
			canvas.classList = "canvas helper";
			game.renderOptions.canvas = canvas;
			JL(".helper-games").appendChild(canvas);
		}

		game.renderOptions.enabled = this.computeOptions.renderHelper;
		game.renderOptions.renderDistance = 8;

		//Init the game
		game.init();

		//Return the cloned game and AI agent
		return {
			game,
			AIPlayer
		};
	}

	generateStepsFromVectorPath(path) {
		return path.map(e => ({
			type: STEP.MOVE,
			direction: e.copy()
		}));
	}

	async followThePath(path, game) {
		if(this.computeOptions.delay) {
			for(const position of path) {
				game.controller.moveTo(position);

				await timeout(this.delay);
			}
		} else if(path.length > 0) {
			game.controller.moveTo(path[path.length - 1]);
		}
	}

	async generateSteps() {
		//Clone the game, so we can play it without affecting the original game
		const {game: _game, AIPlayer: _AIPlayer} = this.cloneGame(this.game);

		//LIFO stack for "recursive" game processing
		const queue = [{game: _game, AIPlayer: _AIPlayer, steps: []}];

		let _i = 0;
		while(queue.length > 0) {
			//Protection against infinite loop
			if(_i++ > this.computeOptions.queueLoopLimit) {
				this.log("Too many iterations");
				this.dispatchEvent("fail", {reason: "Maximum number of iterations exceeded"});
				break;
			}

			//Pop an item from the stack
			const iteration = queue.shift();
			const steps = iteration.steps.slice();

			//Check if the Exit is reachable witout any other actions
			{
				//Generate path to the Exit
				const result = iteration.game.map.find(iteration.game.map.getPlayer().position, object => {
					if(object instanceof Exit) return 1;
					else if(object instanceof Monster) return -1;
				});

				//The exit is reachable
				if(result.found) {
					await iteration.AIPlayer.followThePath(result.path, iteration.game);
					steps.push(...this.generateStepsFromVectorPath(result.path));
					this.log({exitSteps: steps});
					return steps;
				}
			}

			//No reachable Exit found
			if(iteration.game.map.getPlayer().inventory.some(e => e instanceof Arrow)) {
				//Get all reachable monsters from the current position of player
				const monsters = iteration.game.map.getReachable(iteration.game.map.getPlayer().position, Monster);
				this.log("reached monsters", monsters);

				//Loop all the monsters
				for(const monster of monsters) {
					//Generate the path to the monster
					this.log("locating monster", monster);
					const result = iteration.game.map.find(iteration.game.map.getPlayer().position, object => {
						if(object == monster) return 1;
						if(object instanceof Player) return 0;
						if(object instanceof Solid) return -1;
						return 0;
					});
					this.log("locating monster", {playerPosition: iteration.game.map.getPlayer().position}, {result});

					//Path to the monster was found
					if(result.found) {
						//Clone the current state of the game
						const {game: game1, AIPlayer: AIPlayer1} = this.cloneGame(iteration.game);

						//Navigate to the monster in the cloned game
						//game1.map.moveObjectTo(game1.map.getPlayer(), result.path[firstMonsterIndex - 1]);
						const _steps = steps.slice();
						const safePath = result.path.slice(0, -1); this.log({safePath});
						await iteration.AIPlayer.followThePath(safePath, game1);
						_steps.push(...this.generateStepsFromVectorPath(safePath));

						//Shoot the monster
						const direction = Utils.direction(game1.map.getPlayer().position, monster.position).invert();
						_steps.push({
							type: STEP.SHOOT,
							direction
						});
						game1.map.destroyObject(game1.map.getObject(monster.position));
						game1.map.getPlayer().inventory.splice(game1.map.getPlayer().inventory.findIndex(e => e instanceof Arrow), 1);

						//Push the cloned game to the stack for further processing
						queue.push({game: game1, AIPlayer: AIPlayer1, steps: _steps});
					} else {
						this.log("Failed to found any monster");
					}
				}
			} else {
				//find some arrow to to kill the monster
				{
					//Generate path to the closest arrow
					const result = iteration.game.map.find(iteration.game.map.getPlayer().position, object => {
						if(object instanceof Arrow) return 1;
						else if(object instanceof Monster) return -1;
					});

					//The arrow was found
					if(result.found) {
						await iteration.AIPlayer.followThePath(result.path, iteration.game);
						steps.push(...this.generateStepsFromVectorPath(result.path));
						queue.push({game: iteration.game, AIPlayer: iteration.AIPlayer, steps: steps});
						this.log({arrowPickupSteps: steps});
					}
				}
			}
		}

		this.log("No steps found");
		this.dispatchEvent("fail", {reason: "No available actions can be made"});

		return [];
	}

	async __generateSteps(steps = [], __game = this.game) {
		const {game: _game, AIPlayer: _AIPlayer} = this.cloneGame(__game);

		//console.log(_game.map.getPlayer().inventory);

		let madeAction = false;

		//Check if the Exit is reachable witout any other actions
		{
			const result = _game.map.find(_game.map.getPlayer().position, object => {
				if(object instanceof Exit) return 1;
				else if(object instanceof Monster) return -1;
			});

			if(result.found) {
				await this.followThePath(result.path, _game);
				steps.push(...this.generateStepsFromVectorPath(result.path));
				madeAction = true;
				steps._hasFinished = true;
				return steps;
			}
		}

		//No reachable Exit found
		if(_game.map.getPlayer().inventory.some(e => e instanceof Arrow)) {

			//Has some arrows, so go to kill the monster
			{
				//Find a way to the nearest exit
				const result = _game.map.find(_game.map.getPlayer().position, object => {
					if(object instanceof Exit) return 1;
				});

				//This is destructive task, so we need to calculate the right action
				if(result.found) {
					let monsterToAttack = null;

					//Convert vector path to list of map objects
					const objects = result.path.map(p => _game.map.getObject(p));

					//Get all the monsters in the way
					const monsters = objects.filter(e => e instanceof Monster);

					//We know there's at least one monster in between player and the exit
					const firstMonsterIndex = result.path.findIndex(v => v.isEqual(monsters[0].position));

					//Now, let's imagine we kill this monster. Will we be able to made any new actions then?
					{
						//Clone the current state of the game, so we don't mess up the original one
						const {game: game, AIPlayer: AIPlayer} = this.cloneGame(_game);

						//throw new Error("Not implemented");

						//console.log(game, game.map.getPlayer(), game.map.objects.filter(e => e.position.isEqual(game.map.getPlayer().position)));

						//Kill the monster and remove one arrow from inventory
						game.map.destroyObject(game.map.getObject(monsters[0].position));
						game.map.getPlayer().inventory.splice(game.map.getPlayer().inventory.findIndex(e => e instanceof Arrow), 1);

						//Try another action
						await timeout(100);
						var _steps = [];
						const result1 = await AIPlayer.__generateSteps(_steps, game);
						console.log({result1});
						if(result1._hasFinished) {
							steps.push(..._steps);
							return steps;
						}

						//If we kill this monster, there will be some new actions to do
						if(result1.length) {
							monsterToAttack = monsters[0];
							steps.push(..._steps);
						} else {
							//Let's check the next monster

							//AIPlayer.player.inventory.push(new Arrow());

							//If there are no more monsters, the exit is unreachable
							if(monsters.length === 1) {
								console.warn("No more monsters to kill");
								return [];
							}
							else {
								console.log("blocking");

								const {game: game2, AIPlayer: AIPlayer2} = this.cloneGame(game);

								//Kill the monster
								game2.map.destroyObject(game2.map.getObject(monsters[0].position));
								game2.map.addObject(new Wall({position: monsters[0].position}));

								AIPlayer2.game.map.getPlayer().inventory.push(new Arrow());

								//console.log(AIPlayer2.player.inventory);

								//Try another action
								var _steps2 = [];
								const result2 = await AIPlayer2.__generateSteps(_steps2, game2);
								console.log({result2});
								if(result2._hasFinished) {
									steps.push(..._steps2);
									return steps;
								}
								//return result2;
								//madeAction = true;

								if(result2.length) {
									monsterToAttack = monsters[1];
									steps.push(..._steps2);
									madeAction = true;
								}
							}
						}
					}

					//Navigate to one block away from the Monster
					const path = result.path.slice(0, result.path.findIndex(v => v.isEqual(monsterToAttack.position)));
					await this.followThePath(path, _game);

					//Attack the Monster
					const direction = Utils.direction(_game.map.getPlayer().position, monsterToAttack.position).invert();
					_game.controller.shoot(direction);
					steps.push({
						type: STEP.SHOOT,
						direction
					});
					madeAction = true;


					// //Navigate to one block away from the Monster
					// const path = result.path.slice(0, firstMonsterIndex);
					// await this.followThePath(path, _game);

					// //Attack the Monster
					// const direction = Utils.direction(_game.map.getPlayer().position, result.path[firstMonsterIndex]).invert();
					// _game.controller.shoot(direction);
					// madeAction = true;
				}
			}

		} else {
			//find some arrow to to kill the monster
			{
				const result = _game.map.find(_game.map.getPlayer().position, object => {
					if(object instanceof Arrow) return 1;
					else if(object instanceof Monster) return -1;
				});

				if(result.found) {
					await this.followThePath(result.path, _game);
					steps.push(...this.generateStepsFromVectorPath(result.path));
					madeAction = true;
				}
			}
		}

		await timeout(100);

		if(steps._hasFinished) {
			console.log("finished");
			return steps;
		}

		if(!madeAction) {
			console.warn(new Error("No action can be made in current state of the game!"));
			return steps;
			//throw new Error("No action can be made in current state of the game!");
		}

		if(_game.isRunning) {
			console.log("Game is still running!");
			let _steps = [];
			//console.log(_game.map.getPlayer().inventory);
			await this.__generateSteps(_steps, _game);
			if(_steps.length) steps.push(..._steps);

			return steps;
		}
	}

	async __calculateNextPosition(steps = []) {
		let madeAction = false;

		//Check if the Exit is reachable witout any other actions
		{
			const result = this.game.map.find(this.player.position, object => {
				if(object instanceof Exit) return 1;
				else if(object instanceof Monster) return -1;
			});

			if(result.found) {
				await this.followThePath(result.path);
				madeAction = true;
				return true;
			}
		}

		//No reachable Exit found
		if(this.player.inventory.some(e => e instanceof Arrow)) {
			//Has some arrows, so go to kill the monster
			{
				//Find a way to the nearest exit
				const result = this.game.map.find(this.player.position, object => {
					if(object instanceof Exit) return 1;
				});

				//This is destructive task, so we need to calculate the right action
				if(result.found) {
					let monsterToAttack = null;

					//Convert vector path to list of map objects
					const objects = result.path.map(p => this.game.map.getObject(p));

					//Get all the monsters in the way
					const monsters = objects.filter(e => e instanceof Monster);

					//We know there's at least one monster in between player and the exit
					const firstMonsterIndex = result.path.findIndex(v => v.isEqual(monsters[0].position));

					//Now, let's imagine we kill this monster. Will we be able to made any new actions then?
					{
						//Clone the current state of the game, so we don't mess up the original one
						var elm = document.createElement("pre");
						elm.classList = "canvas helper";
						document.body.appendChild(elm);

						const game = this.game.clone();
						console.log(this.game.map.spawn, game.map.spawn);
						const AIPlayer = new PlayerAIv2(game, {delay: 300});
						game.renderOptions.canvas = elm;
						//game.renderOptions.enabled = false;
						game.init();

						//game.map.getPlayer().position = result.path[firstMonsterIndex - 1].copy();
						//game.map.getPlayer().position = result.path[1].copy();
						game.renderer.renderFrame();

						//throw new Error("Not implemented");

						console.log(game, game.map.getPlayer(), game.map.objects.filter(e => e.position.isEqual(game.map.getPlayer().position)));

						//Kill the monster
						game.map.destroyObject(game.map.getObject(monsters[0].position));

						//Try another action
						await timeout(100);
						const result1 = await AIPlayer.__calculateNextPosition();
						console.log({result1});

						//If we kill this monster, there will be some new actions to do
						if(result1) monsterToAttack = monsters[0];
						else {
							//Let's check the next monster

							AIPlayer.player.inventory.push(new Arrow());

							//If there are no more monsters, the exit is unreachable
							if(monsters.length === 1) return false;
							else {
								console.log("blocking");

								var elm2 = document.createElement("pre");
								elm2.classList = "canvas helper";
								document.body.appendChild(elm2);

								//Block the way by replacing moster with wall
								const game2 = game.clone();
								const AIPlayer2 = new PlayerAIv2(game2, {delay: 300});
								game2.renderOptions.canvas = elm2;
								//game2.renderOptions.enabled = false;
								game2.init();

								AIPlayer2.player.inventory.push(new Arrow());

								//Kill the monster
								game2.map.destroyObject(game2.map.getObject(monsters[0].position));
								game2.map.addObject(new Wall({position: monsters[0].position}));

								console.log(AIPlayer2.player.inventory);

								//Try another action
								const result2 = await AIPlayer2.__calculateNextPosition();
								console.log({result2});
								//return result2;
								//madeAction = true;

								if(result2) {
									monsterToAttack = monsters[1];
									madeAction = true;
								}
							}
						}
					}

					//Navigate to one block away from the Monster
					const path = result.path.slice(0, result.path.findIndex(v => v.isEqual(monsterToAttack.position)));
					await this.followThePath(path);

					//Attack the Monster
					const direction = Utils.direction(this.player.position, monsterToAttack.position).invert();
					this.game.controller.shoot(direction);
					madeAction = true;


					// //Navigate to one block away from the Monster
					// const path = result.path.slice(0, firstMonsterIndex);
					// await this.followThePath(path);

					// //Attack the Monster
					// const direction = Utils.direction(this.player.position, result.path[firstMonsterIndex]).invert();
					// this.game.controller.shoot(direction);
					// madeAction = true;
				}
			}
		} else {
			//find some arrow to to kill the monster
			{
				const result = this.game.map.find(this.player.position, object => {
					if(object instanceof Arrow) return 1;
					else if(object instanceof Monster) return -1;
				});

				if(result.found) {
					await this.followThePath(result.path);
					madeAction = true;
				}
			}
		}

		if(!madeAction) {
			console.warn(new Error("No action can be made in current state of the game!"));
			return false;
			//throw new Error("No action can be made in current state of the game!");
		}

		if(this.game.isRunning) {
			return this.__calculateNextPosition();
		}
	}
}