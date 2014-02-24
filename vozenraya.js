var Board = function (Language, Chip) {
	this.language = Language || "es";
	this.dictPath = "dict/";
	this.VoicePath = "voice/" + this.language + "/";
	this.SoundPath = "sound/";
	
	//Enter dictionaries from its respective file.
	//Yes... from global variables.
	this.loadDict = function() {
		this.dictRows = [dict1, dict2, dict3];
		this.dictPlayer = [dictHuman, dictAIrandom, dictAIhard];
		this.dictPlayMenu = [dictHelp, dictCheck, dictGiveUp, dictPause];
		this.dictPauseMenu = [dictContinue, dictExit];
	}
	
	//To select the first color, or to pick the default one.
	this.Chip = Chip || "W";
	if (Chip == "W") {
		this.Color = "Whites";
	} else {
		this.Chip = "B";
		this.Color = "Blacks";
	}
	
	//An empty board.
	this.Squares = this.emptySquares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
	
	var parentThis = this; //Never forget the main object.
	
	//Errors, control and options.
	if (window.location.search.indexOf("debug") > -1) {
		this.debug = true;
	} else {
		this.debug = false;
	}
	
	//Returns a cookie value. Code taken from https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
	this.retrieveCookie = function(key) {
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	}
	
	this.pause = false;
	this.playing = false;
	this.microphoneWorks = this.retrieveCookie("microphone") || false;
	this.failCount = 0;
	this.micBusy = false;
	this.lastWinner = ["X", 0];
	this.gamesSum = parseInt(this.retrieveCookie("gamesSum")) || 0;
	
	if (this.gamesSum >= 10) {
		this.fastGame = true;
	} else {
		this.fastGame = false;
	}
		
	if (this.debug) {
		this.players = {"B": 2, "W": 2, "set": true}; //0 = human. 1+ = IA.
		this.microphoneWorks = true;
	} else {
		this.players = {"B": 0, "W": 0, "set": false};
	}
	
	//Voice sample repository.
	this.loadVoice = function() {
		if (window.SpeechRecognition || window.webkitSpeechRecognition) {
			this.Voice = {
				"no-language": new Audio(this.SoundPath + "no-language.ogg"),
				"welcome": new Audio(this.VoicePath + "welcome.ogg"),
				"5-seconds": new Audio(this.SoundPath + "5-seconds.ogg"),
				"speak-now": new Audio(this.SoundPath + "speak-now.wav"),
				"instructions": new Audio(this.VoicePath + "instructions.ogg"),
				"check-mic": new Audio(this.VoicePath + "check-mic.ogg"),
				"check-mic-ok": new Audio(this.VoicePath + "check-mic-ok.ogg"),
				"check-mic-fail": new Audio(this.VoicePath + "check-mic-fail.ogg"),
				"choose-player": new Audio(this.VoicePath + "choose-player.ogg"),
				"choose-player-fast": new Audio(this.VoicePath + "choose-player-fast.ogg"),
				"choose-human": new Audio(this.VoicePath + "choose-human.ogg"),
				"choose-ai": new Audio(this.VoicePath + "choose-ai.ogg"),
				"first-blacks": new Audio(this.VoicePath + "first-blacks.ogg"),
				"not-working": new Audio(this.VoicePath + "not-working.ogg"),
				"start": new Audio(this.VoicePath + "start.ogg"),
				"pause": new Audio(this.VoicePath + "pause.ogg"),
				"row1": new Audio(this.VoicePath + "row1.ogg"),
				"row2": new Audio(this.VoicePath + "row2.ogg"),
				"row3": new Audio(this.VoicePath + "row3.ogg"),
				"column1": new Audio(this.VoicePath + "column1.ogg"),
				"column2": new Audio(this.VoicePath + "column2.ogg"),
				"column3": new Audio(this.VoicePath + "column3.ogg"),
				"X": new Audio(this.VoicePath + "empty.ogg"),
				"W": new Audio(this.VoicePath + "white.ogg"),
				"B": new Audio(this.VoicePath + "black.ogg"),
				"turnfor": new Audio(this.VoicePath + "turnfor.ogg"),
				"Whites": new Audio(this.VoicePath + "whites.ogg"),
				"Blacks": new Audio(this.VoicePath + "blacks.ogg"),
				"horizontal": new Audio(this.VoicePath + "horizontal.ogg"),
				"vertical": new Audio(this.VoicePath + "vertical.ogg"),
				"diagonal": new Audio(this.VoicePath + "diagonal.ogg"),
				"tie": new Audio(this.VoicePath + "tie.ogg"),
				"surrender": new Audio(this.VoicePath + "surrender.ogg"),
				"busy": new Audio(this.VoicePath + "busy.ogg"),
				"success": new Audio(this.VoicePath + "success.ogg"),
				"unheard": new Audio(this.VoicePath + "unheard.ogg"),
				"silence": new Audio(this.VoicePath + "silence.ogg"),
				"void": new Audio(this.VoicePath + "void.ogg"),
				"general-help": new Audio(this.VoicePath + "general-help.ogg"),
				"put-help": new Audio(this.VoicePath + "put-help.ogg"),
				"available-actions": new Audio(this.VoicePath + "available-actions.ogg"),
				"play-menu": new Audio(this.VoicePath + "play-menu.ogg"),
				"not-implemented": new Audio(this.VoicePath + "not-implemented.ogg"),
				"credits": new Audio(this.VoicePath + "credits.ogg")
			}
		} else {
			//Not a compatible browser. :-( Try again in some months.
			this.micBusy = true;
			var notCompatible = new Audio(this.VoicePath + "not-compatible.ogg");
			notCompatible.play();
		}
	}
	
	//To manually add on the 'start' event of speech recognition objects.
	//No, I don't want to prototypely add it to every like object.
	this.recognitionTime = function() {
		parentThis.micBusy = true;
		parentThis.Voice["speak-now"].play();
		
		//Needed to keep the show on if the mic is stopped accidentally. Specially because of noise.
		antiFreeze = setTimeout(function() {
		if (parentThis.pause == false && parentThis.playing == false) {
			if (parentThis.micBusy) {
				parentThis.micBusy = false;
			}
		}
	}, 12000);

	}
	
	//A generic voice recognition object (despite there are other objects like this later).
	//Documentation: https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html
	this.voiceReceiver = new webkitSpeechRecognition();
	this.voiceReceiver.lang = this.language;
	this.voiceReceiver.onresult = function (event) {
		if (event.results.length > 0) {
			phrase = event.results[0][0].transcript;
			console.log(phrase);
		}
	}
	
	//To retrieve the current board as a string. Only for debug.
 	this.showBoard = function () {
		var output = String(this.Squares[0]) + "\n" + String(this.Squares[1]) + "\n" + String(this.Squares[2]);
 		return (output);
 	}
	
	//To execute at first if mic wasn't tested before. The user must say three words
	this.checkMicrophone = function() {
		this.microphoneWorks = false;
		var voiceTest = new webkitSpeechRecognition();
		voiceTest.lang = this.language;
		
		voiceTest.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results[0][0].transcript;
				results = parentThis.recognizePosition(phrase); //User has to pronounce "1, 2, 3", just like board positions.
				if (results.indexOf(-1) > -1) { //Number not recognized.
					queue = [parentThis.Voice["check-mic-fail"]];
					parentThis.failCount += 1;
				} else { //All clear.
					parentThis.microphoneWorks = true;
					document.cookie = "microphone=true; max-age=2592000";
					queue = [parentThis.Voice["check-mic-ok"],
							 parentThis.Voice["instructions"]];
				}
				parentThis.audioQueue(queue, 100, function() { parentThis.micBusy = false; });
				//Play those voice samples, and free mic when finished.
			}
		}
		
		voiceTest.onerror = function(event) {
			if (event.error == "no-speech" && parentThis.failCount < 3) {
				parentThis.failCount += 1;
				parentThis.audioQueue([parentThis.Voice["silence"]], 100, function() { parentThis.micBusy = false; });
			}
		}
		
		voiceTest.addEventListener('start', this.recognitionTime, false);
		
		//First let's play the instructions, and then do all the action and open the mic.
		this.audioQueue([this.Voice["check-mic"]], 200, function() {
			var forTheCheck = setInterval(function() {
				if (parentThis.microphoneWorks == false) {
					if (parentThis.micBusy == false) {
						if (parentThis.failCount >= 3) { //Too much recognition errors? I quit.
							parentThis.audioQueue([parentThis.Voice["not-working"]], 1);
							document.cookie = "microphone=false;max-age=1";
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
		var anotherVoice = new webkitSpeechRecognition();
		anotherVoice.lang = this.language;
		
		anotherVoice.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results[0][0].transcript;
				var choose = parentThis.compareCommand(phrase, parentThis.dictPlayer);
				if (choose != -1) {
					var partner = ["B", "W"][Math.round(Math.random())];
					parentThis.players[partner] = parseInt(choose);
					
					if (choose == 0) {
						//Humans, choose a color in 5 seconds. Blacks start first.
						var queue = [parentThis.Voice["choose-human"], parentThis.Voice["first-blacks"], parentThis.Voice["5-seconds"]];
						parentThis.audioQueue(queue, 100,
											  function() { parentThis.micBusy = false; parentThis.players["set"] = true; });
					} else {
						//I'll randomly choose your color.
						var queue = [parentThis.Voice["choose-ai"], parentThis.Voice[parentThis.changeTurn(partner)[1]]];
						parentThis.audioQueue(queue, 100,
											  function() { parentThis.micBusy = false; parentThis.players["set"] = true; });
					}
					parentThis.players["set"] = true;
				}
			}
		}
		
		anotherVoice.onerror = function(event) {
			if (event.error == "no-speech" && parentThis.failCount < 3) {
				parentThis.failCount += 1;
				parentThis.audioQueue([parentThis.Voice["silence"]], 100, function() { parentThis.micBusy = false; });
			}
		}
		
		anotherVoice.addEventListener('start', this.recognitionTime, false);
		
		if (this.fastGame) {
			var menu = "choose-player-fast";
		} else {
			var menu = "choose-player";
		}
		
		this.audioQueue([this.Voice[menu]], 100, function() {
			anotherVoice.start();
			var forTheCheck = setInterval(function() {
				if (parentThis.players["set"] == false) {
					if (parentThis.micBusy == false) {
						anotherVoice.start();
					}
				} else {
					clearInterval(forTheCheck);
				}
			}, 100);
		});
	}
	
	
	//To retrieve the current board as a string.
	this.showBoard = function () {
		var output = String(this.Squares[0]) + "\n" + String(this.Squares[1]) + "\n" + String(this.Squares[2]);
		return (output);
	}
	
	//Adapt the recognized words to board positions.
	this.recognizePosition = function(sample) {
		var words = sample.toLowerCase().split(" ");
		var results = [];
		for (var i in words) { //Word by word through the input array.
			var found = -1;
			for (var j in this.dictRows) { //Word by word through the recognition dictionaries.
				if (this.dictRows[j].toString().indexOf(words[i]) > -1) {
					found = j;
				}
			}
			results.push(found);
		}
		return (results);
	}
	
	//The user said a non-number word. Was it a command?
	this.compareCommand = function(sample, dict) {
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
				return this.queueBoard();
				break;
			
			case "2":
				//Give up.
				var voice = [this.Color, "surrender", "start"];
				this.emptyBoard();
				this.changeTurn();
				return voice;
				break;
			
			case "3":
				//Pause.
				this.pauseMenu();
				break;
		}
		return "void";
	}
	
	//Deprecated?
	//Our nice friend will tell you which chip is occupying every board square.
	this.readBoard = function(toQueue) {
		var queue = [];
		var Squares = this.Squares;
		for (var i in Squares) {
			var currentRow = parseInt(i) + 1;
			queue.push(this.Voice["row" + String(currentRow)]); //Say the current board row.
			for (var j in Squares[i]) {
				queue.push(this.Voice[Squares[i][j]]); //Say its color chip, or if it's empty.
			}
		}
		if (toQueue) {
			//For another functions.
			return queue;
		} else {
			//To play right now.
			this.audioQueue(queue, 200);
		}
		return 0;
	}
	
	//Current board status (chip positions and empty squares) for later voice play.
	this.queueBoard = function() {
		var queue = [];
		var Squares = this.Squares;
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
	this.audioQueue = function(queue, delay, callback) {
		delay = delay || 500;
		var i = 0;
		var playNow = function(audio) {
			parentThis.playing = true;
			audio.play();
			i += 1;
			//Interval to call playNow (yeah, this function) when audio has finished playing.
			var waitPlease = setInterval(function() {
				if (i < queue.length) {
					if (audio.ended) {
						setTimeout(function() { playNow(queue[i]) }, delay);
						clearInterval(waitPlease);
					}
				} else {
					//Execute callback when the queue is done.
					if (typeof(callback) == "function") {
						var waitPlease2 = setInterval(function() {
							if (audio.ended) {
								//Is there really no cleaner way to do this?! T_T
								setTimeout(function() { parentThis.playing = false; callback(); }, delay);
								clearInterval(waitPlease2);
							}
						}, 50);
					}
					clearInterval(waitPlease);
				}
			}, 50);
		}
		playNow(queue[i]); //Start!
	}
	
	//Board default state.
	this.emptyBoard = function() {
		this.Squares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
	}
	
	//Retrieve a horizontal line as an array. Easy.
	this.horizontalLine = function(row) {
		return this.Squares[row];
	}
	
	//Retrieve a vertical line as an array. Not so easy.
	this.verticalLine = function(column) {
		var result = [];
		for (var i = 0; i < this.Squares.length; i++) {
			result.push(this.Squares[i][column]);
		}
		return result;
	}
	
	//Retrieve a diagonal line as an array. Not so easy, either.
	this.diagonalLine = function(first) {
		var result = [];
		if (first) { //From upper-left.
			for (var i = 0; i < this.Squares.length; i++) {
				result.push(this.Squares[i][i]);
			}
		} else { //From upper-right.
			for (var i = 0; i< this.Squares.length; i++) {
				result.push(this.Squares[i][this.Squares.length - i - 1]);
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
		var Squares = this.Squares;
		
		//Horizontal
		for (var Row in [0, 1, 2]) {
			if (Squares[Row][0] == Squares[Row][1] && Squares[Row][1] == Squares[Row][2]) {
				if (Squares[Row][0] != "X") {
					return "horizontal";
				}
			}
		}
		
		//A failed attempt to work on bigger boards. Would this kind of game be playable in bigger boards?
		/*for (var Row = 0; Row < Squares.length; Row++) {
			var content = this.horizontalLine(Row);
			var firstColor = content[0];
			if (firstColor == "X") {
				continue;
			}
			var success = true;
			for (var Square = 0; Square < Row.length; Square++) {
				if (Row[Square] != firstColor) {
					success = false;
				}
			}
			if (success) {
				return "horizontal";
			}
		}*/
		
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
		if (this.showBoard().indexOf("X") == -1) {
			return "tie";
		}
		return 0;
	}
	
	//Only for visual control. To delete soon.
	this.decideHuman = function () {
		var Row = prompt(this.Color + ". Fila 1, 2 o 3?");
		Row -= 1;
		var Column = prompt(this.Color + ". Columna 1, 2 o 3?");
		Column -= 1;
		return [Row, Column];
	}
	
	//Check if there's a chip on this specific square.
	this.isOccupied = function (Row, Column) {
		if (this.Squares[Row][Column] != "X") {
			return 1; //It is.
		} else {
			return 0; //It is not.
		}
	}
	
	//Checks if no chip was put yet.
	this.isBoardEmpty = function() {
		return (this.Squares == this.emptySquares);
	}
	
	//Forms an array with every empty position. Useful for AI.
	this.listEmptySquares = function () {
		var empties = [];
		var Squares = this.Squares;
		for (var row in Squares) {
			for (var column in Squares[row]) {
				if (!(this.isOccupied(row, column))) {
					empties.push([parseInt(row), parseInt(column)]); //Row and column as a sub-array.
				}
			}
		}
		return empties;
	}
	
	//Basically change an "X" (empty) for a "B" (black) or a "W" (white).
	this.putChip = function (Chip, Row, Column) {
		if (!(this.isOccupied(Row, Column))) { //Before that, check if it's really empty.
			this.Squares[Row][Column] = Chip;
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
			var previousChip = this.Chip;
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
			this.Chip = otherChip;
			this.Color = otherColor;
		}
		return [otherChip, otherColor];
	}
	
	//Futurely deleted. For visual playing.
	this.basicTurnFlow = function(Target) {
		if (!(this.isOccupied(Target[0], Target[1]))) {
			this.putChip(this.Chip, Target[0], Target[1]);
			if (this.theresLine() || this.theresTie()) {
				this.emptyBoard();
			}
			this.changeTurn();
		}
	}
	
	//The core of a turn. Put the chip if the square is free, check if there's a line, and next turn (or not).
	this.basicTurnFlowWithReturn = function(Target) {
		var turnResult = "success";
		if (!(this.isOccupied(Target[0], Target[1]))) {
			this.putChip(this.Chip, Target[0], Target[1]); //Successful chip.
			
			var line = this.theresLine();
			var tie = this.theresTie();
			if (line) {
				turnResult = line; //End this game and declare a winner.
			} else {
				if (tie) {
					turnResult = tie; //End this game with no winner.
				}
			}
			
			if (line || tie) {
				this.emptyBoard(); //Default board.
			}
			this.changeTurn();
			if (this.debug) {
				console.log(this.Squares);
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
		var empties = this.listEmptySquares();
		var choice = parseInt(Math.random() * empties.length); //Multiply random per possibilities. The old way.
		return empties[choice];
	}
	
	//Here comes auto-business. First list all possibilities, each with a priority. Finally return the better position.
	this.hardAI = function () {
		if (this.debug) console.log(this.showBoard());
		var empties = this.listEmptySquares();
		var own = this.Chip;
		var enemy = this.changeTurn(own)[0];
		if (this.debug) console.log(enemy);
		var options = []; //[row, square, priority (=< 100)]
		var destination = [];
		var maxSquare = this.Squares.length - 1;
		
		//Center free yet? The center is the best square.
		if (!(this.isOccupied(1, 1))) {
			options.push([1, 1, 95]);
		}
		
		//If there's a line almost done, go for it. Be it own or enemy's.
		//Substract priority if enemy's.
		//Check every row and every column. If there are 2 chips of the same color, go!
		for (var i = 0; i < this.Squares.length; i++) {
			if (this.debug) console.log(String(i) + own);
			
		//Horizontals.
			var row = this.horizontalLine(i);
			var colors = this.countChips(row);
			if (colors["X"] == 1) {
				if (this.debug) console.log(colors);
				if (colors[own] == 2) {
					if (this.debug) console.log("YESSS!");
					//Put chip on X. 100.
					options.push([i, row.indexOf("X"), 100]);
				}
				if (colors[enemy] == 2) {
					if (this.debug) console.log("I don't think so.");
					//Put chip on X. 80.
					options.push([i, row.indexOf("X"), 80]);
				}
			}
			
		//Verticals.
			var column = this.verticalLine(i);
			colors = this.countChips(column);
			if (colors["X"] == 1) {
				if (this.debug) console.log(colors);
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
		var diagonal = this.diagonalLine(true);
		var colors = this.countChips(diagonal);
		if (colors["X"] == 1) {
			if (this.debug) console.log(colors);
			if (colors[own] == 2) {
				//Put chip on X. 100.
				options.push([diagonal.indexOf("X"), diagonal.indexOf("X"), 100]);
			} else if (colors[enemy] == 2) {
				//Put chip on X. 80.
				options.push([diagonal.indexOf("X"), diagonal.indexOf("X"), 80]);
			}
		}
		
		//Diagonal upper-right.
		diagonal = this.diagonalLine(false);
		colors = this.countChips(diagonal);
		if (colors["X"] == 1) {
			if (this.debug) console.log(colors);
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
			if (this.Squares[row][column] == "X") {
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
			var output = this.randomAI();
		}
		if (this.debug) console.log(options);
		if (this.debug) console.log(output);
		return output;
	}
	

	//The current core of voice play.
	this.turnFlowWithVoiceAuto = function() {
		var turnResult = "void"; //Default value. This variable will dictate voices played when the turn ends.
		var anotherVoice = new webkitSpeechRecognition();
		anotherVoice.lang = this.language;
		
		anotherVoice.onresult = function (event) {
			if (event.results.length > 0) {
				phrase1 = event.results[0][0].transcript;
				Target1 = parentThis.recognizePosition(phrase1);
				if (Target1.length > 1) {
					if (!(Target1[0] == -1 || Target1[1] == -1)) { //Both numbers are right?
						turnResult = parentThis.basicTurnFlowWithReturn(Target1); //Process them. Put chip if possible.
					}
				} else { //They're not numbers!
					var command = parentThis.compareCommand(phrase1, parentThis.dictPlayMenu); //Compare pronounced word with command list.
					if (command != "") {
						turnResult = parentThis.commandPlayMenu(command); //Play and/or do it.
					} else { //Command or position not recognized.
						parentThis.failCount += 1;
						turnResult = "unheard";
					}
				}
				
				parentThis.micBusy = false; //Free microphone and get ready for the next turn.
			}
		}
		
		anotherVoice.onerror = function (event) {
			if (event.error == "no-speech") {
				//Nothing on the mic.
				parentThis.failCount += 1;
				turnResult = "silence";
				parentThis.micBusy = false;
			}
		}
		
		anotherVoice.addEventListener('start', this.recognitionTime, false);
		
		//Mandatory timed loop to work over Javascript asynchronous nature. Deal with it (until I know a cleaner way).
		var waitPlease = setInterval(function () {
			if (parentThis.micBusy == false && parentThis.pause == false) { //Game started or microphone finished. Come.
				if (parentThis.failCount >= 4) { //Too many recognition errors. Quit loop and, therefore, application.
						parentThis.audioQueue([parentThis.Voice["not-working"]], 1);
						document.cookie = "microphone=false;max-age=1"; //Make sure to check mic the next time.
						clearInterval(waitPlease);
				} else {
					parentThis.micBusy = true; //While true, speech rec won't start again.
					var voiceQueue = []; //Later it will be filled with voice samples to play.
					if (parentThis.debug) console.log(turnResult);
					if (["Array", "object"].indexOf(typeof(turnResult)) > -1) { //More than one sample for turn result.
						for (var i in turnResult) {
							voiceQueue.push(parentThis.Voice[turnResult[i]]);
						}
					} else {
						voiceQueue.push(parentThis.Voice[turnResult]);
					} //Voice queue first refill.
					
					if (["vertical", "horizontal", "diagonal"].indexOf(turnResult[2]) > -1) {
						var otherColor = parentThis.changeTurn(true)[1];
						voiceQueue.push(parentThis.Voice[otherColor]);
						parentThis.gameFinished(); //Cookie work.
						if (parentThis.gamesSum == 10) {
							parentThis.fastGame = true;
							voiceQueue.push(parentThis.Voice["credits"]);
						}
						voiceQueue.push(parentThis.Voice["start"]);
					}
					if ("tie" == turnResult[2]) {
						//Don't change color, please.
						parentThis.gameFinished();
						if (parentThis.gamesSum == 10) {
							parentThis.fastGame = true;
							voiceQueue.push(parentThis.Voice["credits"]);
						}
						voiceQueue.push(parentThis.Voice["start"]);
					} //Extra voice if game has ended.
					
					//Next turn for...
					voiceQueue.push(parentThis.Voice["turnfor"]); 
					voiceQueue.push(parentThis.Voice[parentThis.Color]);
					
					//Now play everything. Later listen to the mic, or get the AI working, to put the next chip.
					parentThis.audioQueue(voiceQueue, 200, function() {
						switch (parentThis.players[parentThis.Chip]) {
							case 0: //Human.
								//parentThis.Voice["speak-now"].play();
								anotherVoice.start();
								break;
							case 1: //Random.
								Target = parentThis.randomAI();
								turnResult = parentThis.basicTurnFlowWithReturn(Target);
								parentThis.micBusy = false;
								break;
							case 2: //Hard.
								Target = parentThis.hardAI();
								turnResult = parentThis.basicTurnFlowWithReturn(Target);
								parentThis.micBusy = false;
								break;
						}
						
					});
				}
			}
		}, 100);
		//Chromium stops recognizing when no voice was detected during some seconds.
	}
	
	
	//Some cookie work...
	this.gameFinished = function() {
		this.gamesSum += 1;
		document.cookie = "gamesSum=" + this.gamesSum + ";max-age=2592000";
		document.cookie = "microphone=true; max-age=2592000";
	}
	
	
	//Shut up until player says "continue".
	this.pauseMenu = function() {
		parentThis.pause = true;
		var anyError = "";
		var voicePause = new webkitSpeechRecognition();
		voicePause.lang = this.language;
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
		
		this.audioQueue([this.Voice["pause"]], 100, function() {
			parentThis.micBusy = true;
			voicePause.start();
		});
	}
	
	
	//Let the (real) game begin.
	this.startGameWithVoice = function () {
		if (this.microphoneWorks == false) {
			this.checkMicrophone();
		}
		var playersChosen = setInterval(function() {
			if (parentThis.microphoneWorks) {
				if (parentThis.players["set"] == false) {
					if (parentThis.micBusy == false) {
						parentThis.chooseAI();
					}
				} else {
					clearInterval(playersChosen);
				}
			}
		}, 250);
		var letsPlay = setInterval(function() {
			if (parentThis.microphoneWorks && parentThis.players["set"]) {
				parentThis.turnFlowWithVoiceAuto(); //All done.
				clearInterval(letsPlay);
			}
		}, 300);
		
	}
	
	this.salute = function() {
		this.firstQueue = [this.Voice["welcome"]];
		if (this.language != navigator.language) {
			this.firstQueue.unshift(this.Voice["no-language"]);
		}
		this.audioQueue(this.firstQueue, 100, function() {
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
	//Still useless due to async. I'm sick of JS natural async.
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
	if (status == 404) {
		this.language = "es";
	}
	this.loadDict(this.language);
	var rightTime = setInterval(function() {
		if (typeof(dict1) != "undefined") {
			clearInterval(rightTime);
			var Tablero1 = new Board(preThis.language);
		}
	}, 60);
}

//Just create a BoardLoader object, and it will start right away. Like:
//var Tablero0 = new BoardLoader();