class PlayerAI {
	constructor(game, options = {}) {
		const {any} = options;

		this.game = game;

		this.network = new NeuralNetwork(5 * 4 + 1, 32, 4);
		this.network.activationFunction = new ActivationFunction(softmax, dsoftmax);
		this.network.learningRate = 0.2;

		this.game.on("init", e => {
			this.player = this.game.map.getPlayer();
		});
	}

	generateInputLayer() {
		/*
		
		[
			distanceToExit,
			up, left, down, right
		]
		
		*/

		const mappings = [undefined, Exit, Arrow, Wall, Monster];
		const input = [];

		const distanceToExit = 1 - this.game.map.search(this.player.position, Exit).path.length / this.game.map.search(this.game.map.spawn, Exit).path.length;
		input.push(distanceToExit);
		// console.log(distanceToExit);

		for(const direction of DIRECTIONS) {
			const object = this.game.map.getObject(this.player.position.copy().add(direction));

			input.push(...mappings.map(e => !object && !e || e && object instanceof e ? 1 : 0));
		}

		// for(const direction of DIRECTIONS) {
		// 	const object = this.game.map.getObject(this.player.position.copy().add(direction));

		// 	input.push(mappings.findIndex(e => !object && !e || e && object instanceof e) / mappings.length);
		// }

		return input;
	}

	predictMovement() {
		const input = this.generateInputLayer();
		const output = this.network.predict(input);
		// console.log(output);

		return DIRECTIONS[output.indexOf(Math.max(...output))];
	}

	mutate(network) {
		this.network = network.copy();
		this.network.mutate(val => val + randomGaussian(-this.network.learningRate, this.network.learningRate));
	}

	calculateFitness() {
		let fitness = 1 - this.game.map.search(this.player.position, Exit).path.length / this.game.map.search(this.game.map.spawn, Exit).path.length;

		if(this.died) fitness -= fitness * 0.4;

		if(fitness < 0) fitness = 0;

		return fitness;
	}
}