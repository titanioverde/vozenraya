var Board = function (Language, Chip) {
	var parentThis = this; //Never forget the main object.
	
	this.language = Language || "es";
	this.dictPath = "dict/";
	this.VoicePath = "voice/" + this.language + "/";
	this.SoundPath = "sound/";
	
	//Enter dictionaries from its respective file.
	//Yes... from global variables.
	this.loadDict = function() {
		parentThis.dictRows = [dict1, dict2, dict3];
		parentThis.dictPlayer = [dictHuman, dictAIrandom, dictAIhard];
		parentThis.dictPlayMenu = [dictHelp, dictCheck, dictGiveUp, dictPause];
		parentThis.dictPauseMenu = [dictContinue, dictExit];
	}
	
	//To select the first color, or to pick the default one.
	this.Chip = Chip || "W";
	if (Chip == "W") {
		parentThis.Color = "Whites";
	} else {
		parentThis.Chip = "B";
		parentThis.Color = "Blacks";
	}
	
	//An empty board.
	this.Squares = this.emptySquares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
	
	//Errors, control and options.
	if (window.location.search.indexOf("debug") > -1) {
		this.debug = true;
	} else {
		this.debug = false;
	}
	
	//An alias for SpeechRecognition class, waiting for it to be cross-browser.
	//ToDo: add browser cases.
	this.Recog = webkitSpeechRecognition;
	//Add event to the prototype?
	
	//Returns a cookie value. Code taken from https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
	//ToDo: Going to delete this thanks to localStorage.
	this.retrieveCookie = function(key) {
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	}
	
	this.pause = false;
	this.playing = false;
	this.microphoneWorks = localStorage.getItem("microphone") || 0;
	this.failCount = 0;
	this.micBusy = false;
	this.lastWinner = ["X", 0];
	this.gamesSum = parseInt(localStorage.getItem("gamesSum")) || 0;
	
	if (this.gamesSum >= 10) {
		this.fastGame = true;
	} else {
		this.fastGame = false;
	}
		
	if (this.debug) {
		this.players = {"B": 0, "W": 0, "set": false}; //0 = human. 1+ = IA.
		this.microphoneWorks = true;
	} else {
		this.players = {"B": 0, "W": 0, "set": false};
	}
	
	//Voice sample repository.
	this.loadVoice = function() {
		if (window.SpeechRecognition || window.webkitSpeechRecognition) {
			parentThis.Voice = {
				"no-language": new Audio(parentThis.SoundPath + "no-language.ogg"),
				"welcome": new Audio(parentThis.VoicePath + "welcome.ogg"),
				"5-seconds": new Audio(parentThis.SoundPath + "5-seconds.ogg"),
				"speak-now": new Audio(parentThis.SoundPath + "speak-now.wav"),
				"instructions": new Audio(parentThis.VoicePath + "instructions.ogg"),
				"check-mic": new Audio(parentThis.VoicePath + "check-mic.ogg"),
				"check-mic-ok": new Audio(parentThis.VoicePath + "check-mic-ok.ogg"),
				"check-mic-fail": new Audio(parentThis.VoicePath + "check-mic-fail.ogg"),
				"choose-player": new Audio(parentThis.VoicePath + "choose-player.ogg"),
				"choose-player-fast": new Audio(parentThis.VoicePath + "choose-player-fast.ogg"),
				"choose-human": new Audio(parentThis.VoicePath + "choose-human.ogg"),
				"choose-ai": new Audio(parentThis.VoicePath + "choose-ai.ogg"),
				"first-blacks": new Audio(parentThis.VoicePath + "first-blacks.ogg"),
				"not-working": new Audio(parentThis.VoicePath + "not-working.ogg"),
				"start": new Audio(parentThis.VoicePath + "start.ogg"),
				"pause": new Audio(parentThis.VoicePath + "pause.ogg"),
				"row1": new Audio(parentThis.VoicePath + "row1.ogg"),
				"row2": new Audio(parentThis.VoicePath + "row2.ogg"),
				"row3": new Audio(parentThis.VoicePath + "row3.ogg"),
				"column1": new Audio(parentThis.VoicePath + "column1.ogg"),
				"column2": new Audio(parentThis.VoicePath + "column2.ogg"),
				"column3": new Audio(parentThis.VoicePath + "column3.ogg"),
				"X": new Audio(parentThis.VoicePath + "empty.ogg"),
				"W": new Audio(parentThis.VoicePath + "white.ogg"),
				"B": new Audio(parentThis.VoicePath + "black.ogg"),
				"turnfor": new Audio(parentThis.VoicePath + "turnfor.ogg"),
				"Whites": new Audio(parentThis.VoicePath + "whites.ogg"),
				"Blacks": new Audio(parentThis.VoicePath + "blacks.ogg"),
				"horizontal": new Audio(parentThis.VoicePath + "horizontal.ogg"),
				"vertical": new Audio(parentThis.VoicePath + "vertical.ogg"),
				"diagonal": new Audio(parentThis.VoicePath + "diagonal.ogg"),
				"tie": new Audio(parentThis.VoicePath + "tie.ogg"),
				"surrender": new Audio(parentThis.VoicePath + "surrender.ogg"),
				"busy": new Audio(parentThis.VoicePath + "busy.ogg"),
				"success": new Audio(parentThis.SoundPath + "success.ogg"),
				"unheard": new Audio(parentThis.VoicePath + "unheard.ogg"),
				"silence": new Audio(parentThis.VoicePath + "silence.ogg"),
				"void": new Audio(parentThis.SoundPath + "void.ogg"),
				"not-implemented": new Audio(parentThis.VoicePath + "not-implemented.ogg"),
				"credits": new Audio(parentThis.VoicePath + "credits.ogg")
			}
		} else {
			//Not a compatible browser. :-( Try again in some months.
			parentThis.micBusy = true;
			const notCompatible = new Audio(parentThis.VoicePath + "not-compatible.ogg");
			notCompatible.play();
		}
	}
	
	//To manually add on the 'start' event of speech recognition objects.
	//No, I don't want to prototypely add it to every like object.
	this.recognitionTime = function() {
		parentThis.audioQueue(parentThis.Voice["speak-now"], 50, 0, function() {
			parentThis.micBusy = true;
			//Needed to keep the show on if the mic is stopped accidentally. Specially because of noise.
			var antiFreeze = setTimeout(function() {
				if (parentThis.debug) console.log("pause: " + parentThis.pause + " playing: " + parentThis.playing + " micBusy: " + parentThis.micBusy);
				if (parentThis.playing) {
					clearTimeout(antiFreeze);
				}
				if (parentThis.pause == false && parentThis.playing == false) {
					if (parentThis.micBusy) {
						parentThis.micBusy = false;
					}
				}
			}, 10050);
			
		});
		

	}
	
	
	//To retrieve the current board as a string. Only for debug.
 	this.showBoard = function () {
		var output = String(parentThis.Squares[0]) + "\n" + String(parentThis.Squares[1]) + "\n" + String(parentThis.Squares[2]);
 		return (output);
 	}
	
	this.checkMicrophoneStart = function() {
		queue = [];
		parentThis.microphoneWorks = false;
		var checkMicRecog = new parentThis.Recog();
		checkMicRecog.lang = parentThis.language;
		
		checkMicRecog.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results.length[0][0].transcript;
				if (parentThis.debug) console(phrase);
				results = parentThis.recognizePosition(phrase);
				if (results.indexOf(-1) > -1) {
					queue = [parentThis.Voice["check-mic-fail"]];
					parentThis.failCount += 1;
				} else {
					parentThis.microphoneWorks = true;
					localStorage.setItem("microphone", 1);
					queue = [parentThis.Voice["check-mic-ok"],
							 parentThis.Voice["instructions"]];
				}
			}
			audioQueue(queue, 100, false, function() {
				parentThis.micBusy = false; //Why the hell? Continue from here.
				checkMicRecog = null;
			});
		}
	}
	
	//To execute at first if mic wasn't tested before. The user must say three words
	this.checkMicrophone = function() {
		parentThis.microphoneWorks = false;
		var voiceTest = new webkitSpeechRecognition();
		voiceTest.lang = parentThis.language;
		
		voiceTest.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results[0][0].transcript;
				if (parentThis.debug) console.log(phrase);
				results = parentThis.recognizePosition(phrase); //User has to pronounce "1, 2, 3", just like board positions.
				if (results.indexOf(-1) > -1) { //Number not recognized.
					queue = [parentThis.Voice["check-mic-fail"]];
					parentThis.failCount += 1;
				} else { //All clear.
					parentThis.microphoneWorks = true;
					localStorage.setItem("microphone", 1);
					queue = [parentThis.Voice["check-mic-ok"],
							 parentThis.Voice["instructions"]];
				}
				parentThis.audioQueue(queue, 100, false, function() { parentThis.micBusy = false; });
				//Play those voice samples, and free mic when finished.
			}
		}
		
		voiceTest.onerror = function(event) {
			if (event.error == "no-speech" && parentThis.failCount < 3) {
				parentThis.failCount += 1;
				parentThis.audioQueue([parentThis.Voice["silence"]], 100, false, function() { parentThis.micBusy = false; });
			}
		}
		
		voiceTest.addEventListener('start', parentThis.recognitionTime, false);
		
		
		//First let's play the instructions, and then do all the action and open the mic.
		this.audioQueue([parentThis.Voice["check-mic"]], 200, false, function() {
			var forTheCheck = setInterval(function() {
				if (parentThis.microphoneWorks == false) {
					if (parentThis.micBusy == false) {
						if (parentThis.failCount >= 3) { //Too much recognition errors? I quit.
							parentThis.audioQueue([parentThis.Voice["not-working"]], 1, false);
							localStorage.setItem("microphone", 0);
							clearInterval(forTheCheck);
						} else { //Start!
							voiceTest.start();
						}
					}
				} else { //It works! Clear and let's get started.
					parentThis.failCount = 0;
					clearInterval(forTheCheck);
				}
			}, 60);
		});
	}
	
	this.defaultOnerror = function(event, turnResult) {
		if (event.error == "no-speech") {
			//Nothing on the mic.
			parentThis.failCount += 1;
			turnResult = "silence";
			parentThis.micBusy = false;
		}
		//Remaining errors: audio-capture, network, not-allowed/service-not-allowed, 
		return turnResult;
	}
	
	//Interactive menu. Human or AI level.
	this.chooseAI = function() {
		parentThis.micBusy = true;
		var anotherVoice = new parentThis.Recog();
		anotherVoice.lang = parentThis.language;
		
		anotherVoice.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results[0][0].transcript;
				if (parentThis.debug) console.log(phrase);
				var choose = parentThis.compareCommand(phrase, parentThis.dictPlayer);
				if (choose != -1) {
					var partner = ["B", "W"][Math.round(Math.random())];
					parentThis.players[partner] = parseInt(choose);
					
					if (choose == 0) {
						//Humans, choose a color in 5 seconds. Blacks start first.
						var queue = [parentThis.Voice["choose-human"], parentThis.Voice["first-blacks"], parentThis.Voice["5-seconds"]];
						parentThis.audioQueue(queue, 90, false,
											  function() { parentThis.micBusy = false; parentThis.players["set"] = true; parentThis.turnFlowWithEvents(); });
					} else {
						//I'll randomly choose your color.
						var queue = [parentThis.Voice["choose-ai"], parentThis.Voice[parentThis.changeTurn(partner)[1]]];
						parentThis.audioQueue(queue, 90, false,
											  function() { parentThis.micBusy = false; parentThis.players["set"] = true; parentThis.turnFlowWithEvents(); });
					}
					parentThis.players["set"] = true;
				}
			}
		}
		
		anotherVoice.onerror = function(event) {
			if (event.error == "no-speech" && parentThis.failCount < 3) {
				parentThis.failCount += 1;
				parentThis.audioQueue([parentThis.Voice["silence"]], 100, false, function() { parentThis.micBusy = false; });
			}
		}
		
		anotherVoice.addEventListener('start', this.recognitionTime, false);
		
		if (this.fastGame) {
			var menu = "choose-player-fast";
		} else {
			var menu = "choose-player";
		}
		
		endedVoice = function(event) {
			
		}
		
		this.audioQueue([parentThis.Voice[menu]], 100, false, function() {
			anotherVoice.start();
/*			var forTheCheck = setInterval(function() {
				if (parentThis.players["set"] == false) {
					if (parentThis.micBusy == false) {
						anotherVoice.start();
					}
				} else {
					clearInterval(forTheCheck);
				}
			}, 1303);*/
		});
	}
	
	
	//To retrieve the current board as a string.
	this.showBoard = function () {
		var output = String(parentThis.Squares[0]) + "\n" + String(parentThis.Squares[1]) + "\n" + String(parentThis.Squares[2]);
		return (output);
	}
	
	//Adapt the recognized words to board positions.
	this.recognizePosition = function(sample) {
		const jointNumbers = new RegExp(/\d\d/g); 
		if (jointNumbers.test(sample)) sample = sample[0] + " " + sample[1];
		var words = sample.toLowerCase().split(" ");
		var results = [];
		for (var i in words) { //Word by word through the input array.
			var found = -1;
			for (var j in parentThis.dictRows) { //Word by word through the recognition dictionaries.
				if (parentThis.dictRows[j].toString().indexOf(words[i]) > -1) {
					found = j;
				}
			}
			results.push(found);
		}
		return (results);
	}
	
	//The user said a non-number word. Was it a command?
	this.compareCommand = function(sample, dict) {
		if (parentThis.debug) console.log(sample + " " + dict);
		var word = sample.toLowerCase().split(" ")[0];
		var result = "";
		for (var i in dict) {
			if (dict[i].toString().indexOf(word) > -1) {
				//Yes, it is. Here is the array position for that command.
				result = i;
			}
		}
		return result;
	}
	
	//Command menu between normal game turns.
	this.commandPlayMenu = function(index) {
		switch (index) {
			case "0":
				//Bring some help.
				return ["instructions"];
				break;
				
			case "1":
				//Check.
				return parentThis.queueBoard();
				break;
			
			case "2":
				//Give up.
				var voice = [parentThis.Color, "surrender", "start"];
				parentThis.emptyBoard();
				parentThis.changeTurn();
				return voice;
				break;
			
			case "3":
				//Pause.
				parentThis.pauseMenu();
				break;
		}
		return "void";
	}
	
	
	//Current board status (chip positions and empty squares) for later voice play.
	this.queueBoard = function() {
		var queue = [];
		var Squares = parentThis.Squares;
		for (var i in Squares) {
			var currentRow = parseInt(i) + 1;
			queue.push("row" + String(currentRow));
			for (var j in Squares[i]) {
				queue.push(Squares[i][j]); //Its chip color, or if it's empty.
			}
		}
		return queue; //Just a string array. But they're names appearing in Voice list.
	}
	
	//Main and wonderful function to orderly play audio samples.
	//It will execute another function when finished (callback) if specified. 
	this.audioQueue = function(queue, delay, randomRate, callback) {
		delay = delay || 500;
		randomRate = randomRate || false;
		if (parentThis.debug) console.log(callback);
		if (parentThis.debug) console.log(queue);
		
		var waitPlease = function() {
			queue[0].removeEventListener("ended", waitPlease, false);
			queue[0].playbackRate = 1;
			queue.shift();
			if (parentThis.debug) console.log(queue[0]);
			
			if (queue.length > 0) {
				queue[0].addEventListener("ended", waitPlease, false);
				if (randomRate) queue[0].playbackRate = 0.8 + Math.random() * 0.4;
				setTimeout(function() { queue[0].play() }, delay);
			} else {
				setTimeout(function() { parentThis.playing = false; callback(); }, delay);
			}
		}
		
		parentThis.playing = true;
		if (randomRate) queue[0].playbackRate = 0.8 + Math.random() * 0.4;
		if (parentThis.debug) console.log(queue[0]);
		queue[0].addEventListener("ended", waitPlease, false);
		queue[0].play();
	}
	
	//Board default state.
	this.emptyBoard = function() {
		parentThis.Squares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
	}
	
	//Retrieve a horizontal line as an array. Easy.
	this.horizontalLine = function(row) {
		return parentThis.Squares[row];
	}
	
	//Retrieve a vertical line as an array. Not so easy.
	this.verticalLine = function(column) {
		var result = [];
		for (var i = 0; i < parentThis.Squares.length; i++) {
			result.push(parentThis.Squares[i][column]);
		}
		return result;
	}
	
	//Retrieve a diagonal line as an array. Not so easy, either.
	this.diagonalLine = function(first) {
		var result = [];
		if (first) { //From upper-left.
			for (var i = 0; i < parentThis.Squares.length; i++) {
				result.push(parentThis.Squares[i][i]);
			}
		} else { //From upper-right.
			for (var i = 0; i< parentThis.Squares.length; i++) {
				result.push(parentThis.Squares[i][parentThis.Squares.length - i - 1]);
			}
		}
		return result;
	}
	
	//To help AI detect if there is a potential line.
	this.countChips = function(row) {
		var colors = {};
		colors["X"] = row.filter(function(x) { return x == "X"; }).length;
		colors["B"] = row.filter(function(x) { return x == "B"; }).length;
		colors["W"] = row.filter(function(x) { return x == "W"; }).length;
		return colors;
	}
	
	//To check if there's a horizontal, vertical or diagonal line of the same color.
	this.theresLine = function() {
		var Squares = parentThis.Squares;
		
		//Horizontal
		for (var Row in [0, 1, 2]) {
			if (Squares[Row][0] == Squares[Row][1] && Squares[Row][1] == Squares[Row][2]) {
				if (Squares[Row][0] != "X") {
					return "horizontal";
				}
			}
		}
		
		//Vertical
		for (var Column in [0, 1, 2]) {
			if (Squares[0][Column] == Squares[1][Column] && Squares[1][Column] == Squares[2][Column]) {
				if (Squares[0][Column] != "X") {
					return "vertical";
				}
			}
		}
		
		//Diagonal
		var Cen = Squares[1][1];
		if ((Squares[0][0] == Cen && Cen == Squares[2][2]) || (Squares[0][2] == Cen && Cen == Squares[2][0])) {
			if (Cen != "X") {
				return "diagonal";
			}
		}
		
		return 0;
	}
	
	//Run when board is full and no line condition is true.
	this.theresTie = function () {
		if (parentThis.showBoard().indexOf("X") == -1) {
			return "tie";
		}
		return 0;
	}
	
	//Only for visual control. To delete soon.
	this.decideHuman = function () {
		var Row = prompt(parentThis.Color + ". Fila 1, 2 o 3?");
		Row -= 1;
		var Column = prompt(parentThis.Color + ". Columna 1, 2 o 3?");
		Column -= 1;
		return [Row, Column];
	}
	
	//Check if there's a chip on this specific square.
	this.isOccupied = function (Row, Column) {
		if (parentThis.Squares[Row][Column] != "X") {
			return 1; //It is.
		} else {
			return 0; //It is not.
		}
	}
	
	//Checks if no chip was put yet.
	this.isBoardEmpty = function() {
		return (parentThis.Squares == parentThis.emptySquares);
	}
	
	//Forms an array with every empty position. Useful for AI.
	this.listEmptySquares = function () {
		var empties = [];
		var Squares = parentThis.Squares;
		for (var row in Squares) {
			for (var column in Squares[row]) {
				if (!(parentThis.isOccupied(row, column))) {
					empties.push([parseInt(row), parseInt(column)]); //Row and column as a sub-array.
				}
			}
		}
		return empties;
	}
	
	//Basically change an "X" (empty) for a "B" (black) or a "W" (white).
	this.putChip = function (Chip, Row, Column) {
		if (!(parentThis.isOccupied(Row, Column))) { //Before that, check if it's really empty.
			parentThis.Squares[Row][Column] = Chip;
			return 1;
		} else {
			return 0; //Oops! This square is already taken.
		}
	}
	
	//Alternates between each player for the next turn.
	//If dontChange, just return which would be the next player.
	//Or if a Chip is passed as dontChange, it will return the opposite player.
	this.changeTurn = function (dontChange) {
		dontChange = dontChange || false;
		if (["W", "B"].indexOf(dontChange) > -1) {
			var previousChip = dontChange;
		} else {
			var previousChip = parentThis.Chip;
		}
		var otherChip, otherColor;
		
		if (previousChip == "B") {
			otherChip = "W";
			otherColor = "Whites";
		} else {
			otherChip = "B";
			otherColor = "Blacks";
		}
		
		if (!(dontChange)) {
			parentThis.Chip = otherChip;
			parentThis.Color = otherColor;
		}
		return [otherChip, otherColor];
	}
	
	//The core of a turn. Put the chip if the square is free, check if there's a line, and next turn (or not).
	this.basicTurnFlowWithReturn = function(Target) {
		var turnResult = "success";
		if (!(parentThis.isOccupied(Target[0], Target[1]))) {
			parentThis.putChip(parentThis.Chip, Target[0], Target[1]); //Successful chip.
			
			var line = parentThis.theresLine();
			var tie = parentThis.theresTie();
			if (line) {
				turnResult = line; //End this game and declare a winner.
			} else {
				if (tie) {
					turnResult = tie; //End this game with no winner.
				}
			}
			
			if (line || tie) {
				parentThis.emptyBoard(); //Default board.
			}
			parentThis.changeTurn();
			if (parentThis.debug) {
				console.log(parentThis.Squares);
			}
		} else { //Oh my... That square was already taken.
			turnResult = "busy";
		}
		
		var row = parseInt(Target[0]) + 1;
		var column = parseInt(Target[1]) + 1;
		return ["row" + row, "column" + column, turnResult]; //Pronounce position and result.
	}
	
	//First "AI" level. Pick a random empty square from a list.
	this.randomAI = function () {
		var empties = parentThis.listEmptySquares();
		var choice = parseInt(Math.random() * empties.length); //Multiply random per possibilities. The old way.
		return empties[choice];
	}
	
	//Here comes auto-business. First list all possibilities, each with a priority. Finally return the better position.
	this.hardAI = function () {
		if (parentThis.debug) console.log(parentThis.showBoard());
		var empties = parentThis.listEmptySquares();
		var own = parentThis.Chip;
		var enemy = parentThis.changeTurn(own)[0];
		if (parentThis.debug) console.log(enemy);
		var options = []; //[row, square, priority (=< 100)]
		var destination = [];
		var maxSquare = parentThis.Squares.length - 1;
		
		//Center free yet? The center is the best square.
		if (!(parentThis.isOccupied(1, 1))) {
			options.push([1, 1, 95]);
		}
		
		//If there's a line almost done, go for it. Be it own or enemy's.
		//Substract priority if enemy's.
		//Check every row and every column. If there are 2 chips of the same color, go!
		for (var i = 0; i < parentThis.Squares.length; i++) {
			if (parentThis.debug) console.log(String(i) + own);
			
		//Horizontals.
			var row = parentThis.horizontalLine(i);
			var colors = parentThis.countChips(row);
			if (colors["X"] == 1) {
				if (parentThis.debug) console.log(colors);
				if (colors[own] == 2) {
					if (parentThis.debug) console.log("YESSS!");
					//Put chip on X. 100.
					options.push([i, row.indexOf("X"), 100]);
				}
				if (colors[enemy] == 2) {
					if (parentThis.debug) console.log("I don't think so.");
					//Put chip on X. 80.
					options.push([i, row.indexOf("X"), 80]);
				}
			}
			
		//Verticals.
			var column = parentThis.verticalLine(i);
			colors = parentThis.countChips(column);
			if (colors["X"] == 1) {
				if (parentThis.debug) console.log(colors);
				if (colors[own] == 2) {
					//Put chip on X. 100.
					options.push([column.indexOf("X"), i, 100]);
				} else if (colors[enemy] == 2) {
					//Put chip on X. 80.
					options.push([column.indexOf("X"), i, 80]);
				}
			}
		}
		
		//Diagonal upper-left.
		var diagonal = parentThis.diagonalLine(true);
		var colors = parentThis.countChips(diagonal);
		if (colors["X"] == 1) {
			if (parentThis.debug) console.log(colors);
			if (colors[own] == 2) {
				//Put chip on X. 100.
				options.push([diagonal.indexOf("X"), diagonal.indexOf("X"), 100]);
			} else if (colors[enemy] == 2) {
				//Put chip on X. 80.
				options.push([diagonal.indexOf("X"), diagonal.indexOf("X"), 80]);
			}
		}
		
		//Diagonal upper-right.
		diagonal = parentThis.diagonalLine(false);
		colors = parentThis.countChips(diagonal);
		if (colors["X"] == 1) {
			if (parentThis.debug) console.log(colors);
			var position = diagonal.indexOf("X");
			if (colors[own] == 2) {
				//Put chip on X. 100.
				options.push([position, diagonal.length - position - 1, 100]);
			} else if (colors[enemy] == 2) {
				//Put chip on X. 80.
				options.push([position, diagonal.length - position - 1, 80]);
			}
		}
		
		//Look for free and occupied corners.
		var corners = [[0, 0], [0, maxSquare], [maxSquare, 0], [maxSquare, maxSquare]];
		for (var i in corners) {
			var row = corners[i][0];
			var column = corners[i][1];
			if (parentThis.Squares[row][column] == "X") {
				options.push([row, column, 50]);
			}
		}
		
		//Now let the computer decide.
		if (options.length > 0) {
			var better = 0;
			var choice = [];
			
			//Pick the best quality solutions.
			for (var i = 0; i < options.length; i++) {
				if (options[i][2] > better) {
					better = options[i][2];
				}
			}
			
			//List them.
			for (var i = 0; i < options.length; i++) {
				if (options[i][2] == better) {
					choice.push([options[i][0], options[i][1]]);
				}
			}
			
			//And choose any of them (if there's more than one).
			var output = choice[parseInt(Math.random() * choice.length)];
		} else { //If no better option, random.
			var output = parentThis.randomAI();
		}
		if (parentThis.debug) console.log(options);
		if (parentThis.debug) console.log(output);
		return output;
	}
	
	this.turnFlowWithEvents = function() {
		parentThis.audioQueue([parentThis.Voice["start"], parentThis.Voice["turnfor"], parentThis.Voice[parentThis.Color]], 80, true, function() { parentThis.nextTurn(); });
	}
	
	//Let's process voice commands.
	this.gameRecogResult = function(event) {
		//parentThis.gameRecog.abort();
		turnResult = "void";
		if (event.results.length > 0) {
			phrase1 = event.results[0][0].transcript;
			if (parentThis.debug) console.log(phrase1);
			Target1 = parentThis.recognizePosition(phrase1);
			if (Target1.length > 1) {
				if (!(Target1[0] == -1 || Target1[1] == -1)) {
					turnResult = parentThis.basicTurnFlowWithReturn(Target1);
				}
			} else { //They're not numbers!!
				var command = parentThis.compareCommand(phrase1, parentThis.dictPlayMenu);
				if (command != "") {
					turnResult = parentThis.commandPlayMenu(command);
				} else { //Command or position not recognized.
					console.log(phrase1);
					parentThis.failCount += 1;
					turnResult = "unheard";
				}
			}
		} else {
			parentThis.failCount += 1;
			turnResult = "no-speech";
		}
		parentThis.gameRecogResultCheck(turnResult);
	};
	
	//Move on the game with voice or AI results.
	this.gameRecogResultCheck = function(turnResult) {
		if (parentThis.failCount >= 4) {
			parentThis.audioQueue([parentThis.Voice["not-working"]], 1, false);
			parentThis.gameRecog = null;
		} else {
			voiceQueue = [];
			if (["Array", "object"].indexOf(typeof(turnResult)) > -1) {
				for (var i in turnResult) {
					voiceQueue.push(parentThis.Voice[turnResult[i]]);
				}
			} else {
				voiceQueue.push(parentThis.Voice[turnResult]);
			}
			if (["vertical", "horizontal", "diagonal"].indexOf(turnResult[2]) > -1) {
				var otherColor = parentThis.changeTurn(true)[1];
				voiceQueue.push(parentThis.Voice[otherColor]);
				parentThis.gameFinished();
				if (parentThis.gameSum == 10) {
					parentThis.fastGame = true;
					voiceQueue.push(parentThis.Voice["credits"]);
				}
				voiceQueue.push(parentThis.Voice["start"]);
			}
			
			if ("tie" == turnResult[2]) {
				parentThis.gameFinished();
				if (parentThis.gameSum == 10) {
					parentThis.fastGame = true;
					voiceQueue.push(parentThis.Voice["credits"]);
				}
				voiceQueue.push(parentThis.Voice["start"]);
			}
			
			voiceQueue.push(parentThis.Voice["turnfor"]);
			voiceQueue.push(parentThis.Voice[parentThis.Color]);
			
			parentThis.audioQueue(voiceQueue, 80, true, parentThis.nextTurn);
		}
	};
	
	this.nextTurn = function() {
		//parentThis.gameRecog.abort();
		switch (parentThis.players[parentThis.Chip]) {
			case 0: //Human
				parentThis.gameRecog.start();
				break;
			case 1: //Random
				Target = parentThis.randomAI();
				turnResult = parentThis.basicTurnFlowWithReturn(Target);
				parentThis.gameRecogResultCheck(turnResult);
				break;
			case 2: //Hard
				Target = parentThis.hardAI();
				turnResult = parentThis.basicTurnFlowWithReturn(Target);
				parentThis.gameRecogResultCheck(turnResult);
				break;
		}
	}

	this.gameRecog = new this.Recog();
	this.gameRecog.lang = this.language;
	this.gameRecog.onresult = this.gameRecogResult;
	
	
	//Some "cookie" work...
	this.gameFinished = function() {
		parentThis.gamesSum += 1;
		localStorage.setItem("gamesSum", parentThis.gamesSum);
		localStorage.setItem("microphone", 1);
	}
	
	
	//Shut up until player says "continue".
	this.pauseMenu = function() {
		parentThis.pause = true;
		var anyError = "";
		var voicePause = new webkitSpeechRecognition();
		voicePause.lang = parentThis.language;
		voicePause.continuous = false;
		
		voicePause.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results[0][0].transcript;
				var command = parentThis.compareCommand(phrase, parentThis.dictPauseMenu);
				if (command == 0) { //"Continue"
					parentThis.pause = false;
					parentThis.micBusy = false;
				}
			}
		}
		
		//Best method I got.
		voicePause.onerror = function(event) {
			anyError = event.error;
		}
		
		//If there was an error or simply there was no speech, listen again.
		voicePause.onend = function() {
			if (anyError != "") {
				voicePause.stop();
				anyError = "";
				voicePause.start();
			}
		}
		
		this.audioQueue([parentThis.Voice["pause"]], 100, false, function() {
			parentThis.micBusy = true;
			voicePause.start();
		});
	}
	
	
	//Let the (real) game begin.
	this.startGameWithVoice = function () {
		if (parentThis.microphoneWorks == false) {
			parentThis.checkMicrophone();
		}
		var playersChosen = setInterval(function() {
			if (parentThis.microphoneWorks) {
				if (parentThis.players["set"] == false) {
					if (parentThis.micBusy == false && parentThis.playing == false) {
						parentThis.chooseAI();
					}
				} else {
					clearInterval(playersChosen);
				}
			}
		}, 1300);
		var letsPlay = setInterval(function() {
			if (parentThis.microphoneWorks && parentThis.players["set"]) {
				//parentThis.turnFlowWithEvents(); //All done.
				clearInterval(letsPlay);
			}
		}, 1000);
		
	}
	
	this.salute = function() {
		parentThis.firstQueue = [parentThis.Voice["welcome"]];
		if (parentThis.language != navigator.language) {
			parentThis.firstQueue.unshift(parentThis.Voice["no-language"]);
		}
		parentThis.audioQueue(parentThis.firstQueue, 100, false, function() {
			parentThis.startGameWithVoice();
		});

	}
	
	//Page loaded. GO!!
	this.loadDict();
	this.loadVoice();
	this.salute();
}

var BoardLoader = function() {
	this.language = navigator.language;
	
	//To make sure if this language is ready in our game.
	//Tries to load its recognition dictionary.
	this.petition = new XMLHttpRequest();
	this.petition.open("HEAD", "dict/" + this.language + ".js", false);
	
	this.petition.send();
	var status = 1;
	var preThis = this;
	
	this.loadDict = function(lang) {
		var htmlFather = document.createElement("script");
		htmlFather.src = "dict/" + lang + ".js";
		document.body.appendChild(htmlFather);
	}
	
	status = preThis.petition.status;
	if (status == 404) { //If fail, load the default language.
		this.language = "es"; //<-- Default language. You can change this in the future.
	}
	this.loadDict(this.language);
	var rightTime = setInterval(function() {
		if (typeof(dict1) != "undefined") { //Check finished.
			clearInterval(rightTime);
			var Tablero1 = new Board(preThis.language);
		}
	}, 60);
}

//Just create a BoardLoader object, and it will start right away. Like:
//var Tablero0 = new BoardLoader();
//One last note: its html page should be loaded through HTTPS. Chrome (and probably other browsers in the future)
//will ask for mic capture permission every time on normal HTTP.