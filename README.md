# Jaskyniar game
Miniprog 2022 – correspondence round

## Final results (2022-05-18)
* **2nd place 🥈🏆**

## Overview
**NOTE**: The game does not contain any textures or any other "good looking" things. I found this competition on 27th of March and the deadline was on 31st same month, therefore there wasn't enough time for any additional stuff. All the required functionalities were successfully implemented (hopefully).

**NOTE**: Please try to avoid pressing the start button multiple times since it creates new instance of the game every time and you would be playing multiple games at the same time in the same screen.

## Progress
* ✅ Map parsing (**5 pts**)
* ✅ Basic rendering + player movement (**10 pts**)
* ✅ Shooting mechanism (**15 pts**)
* ✅ View radius distance (**5 pts**)
* ✅ Navigation (**15 pts**)
* ✅ Raycast rendering (**25 pts**) (**BONUS**)
* ✅ AI player (**50 pts**) (**BONUS**)

## Deployment

1. Setup a simple web server of your choice serving the static files
2. Clone this repo to root directory of your server (or anywhere else, as you wish)
3. In your browser, navigate to `<host>/game.html` to get the game page
4. Change the options according to your preferences (or keep as default) and press the **"Start the game!"** button

## External dependencies
This project is using:

* general purpose library called [JustLib.js](https://git.loumadev.eu/JustLib-js)
* simple neural network library [NeuralNetwork.js](https://loumadev.eu/raw/NeuralNetwork.js)

NOTE: All these libraries are created and maintained by me (LoumaDev), so technically it is not cheating.

## Online demo
You can check online demo right now [here](http://loumadev.eu/miniprog/2022/kk/game.html?_src=git) without need of setting up your own web server.

## Options
Since the instructions contained multiple possibilities for the same functionalities, there are adjustable options available to the user:

* **Player mode** - Switching between real player and AI player (neural AI agent fails most of the times, so prefer using AI Agent v2)
* **AI Player delay** - Defines the delay between actions of the AI agent v2
* **Render helper games** - Renders helper games while computing AI steps (great to visualize how the AI internally works)
* **Game map** - Map selection (Contains all the provided maps as well as some of the maps from development)
* **Rendering mode** - Allows to choose between basic and raycast renderer
* **Render distance** - Controls the screen buffer dimensions (how big the screen is)
* **View radius** - Radius from the player's current position where they can see things (controls moodiness) (only allowed when using the raycast renderer) (_might be a little bit glitchy for larger values since this is really small 2D integer grid_)
* **Always Draw Walls** - Forces the renderer to always draw the walls (this feature was required by the instructions, but I personally think it is better to keep this off since it's annoying to see just the walls and other entities are suddenly appearing in front of you)
* **Draw Rays** - Enables fallback characters rendering (with raycast rendering this looks like rays shooting out of the player)
* **Use colors** - Enables simple coloring system for each object (used to better identify the objects)
* **Navigation mode** - Controls how the navigation behave. _Direction mode_ is just to show the direction to located object. _Route mode_ is to highlight the full path to the located object

## Time spent

* **PlayerAIv2.js** 8 hrs 49 mins
* **main.js** 3 hrs 58 mins
* **Renderer.js** 2 hrs 16 mins
* **GameMap.js** 1 hr 48 mins
* **Game.js** 1 hr 22 mins
* **game.html** 1 hr 15 mins
* **PlayerAI.js** 1 hr 11 mins
* **MapParser.js** 57 mins
* **MapObject.js** 51 mins
* **UI.js** 41 mins
* **Utils.js** 39 mins
* **Navigation.js** 36 mins
* **style.css** 18 mins
* **Player.js** 8 mins
