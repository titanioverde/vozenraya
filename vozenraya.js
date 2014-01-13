var dict1 = ["uno", "1"];
var dict2 = ["dos", "2", "tos"];
var dict3 = ["tres", "3", "crees"];

var dictA = ["a", "ah"];
var dictB = ["b", "be"];
var dictC = ["c", "ce"];

var dictRows = [dict1, dict2, dict3];
var dictColumns = [dictA, dictB, dictC];

var dictHelp = ["ayuda"];

var dictStart = ["comenzar"];
var dictHuman = ["humano"];
var dictCPU = ["ordenador"];

var dictMainMenu = [dictStart, dictHuman, dictCPU];

var dictCheck = ["revisar"];
var dictPut = ["colocar"];
var dictGiveUp = ["abandonar"];

var dictPlayMenu = [dictHelp, dictCheck, dictPut, dictGiveUp];


var Board = function (Chip) {
	this.language = "es-ES";
	
	//To select the first color, or to pick the default one.
	this.Chip = Chip || "W";
	if (Chip == "W") {
		this.Color = "Whites";
	} else {
		this.Chip = "B";
		this.Color = "Blacks";
	}
	
	//An empty board.
	this.Squares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
	
	var parentThis = this; //Never forget the main object.
	
	//Errors, control and options.
	if (window.location.search.indexOf("debug") > -1) {
		this.debug = true;
	} else {
		this.debug = false;
	}
	
	this.mainQueue = [];
	this.mainBusy = false; //Semaphore, basically.
	this.microphoneWorks = this.debug;
	this.failCount = 0;
	this.micBusy = false;
	this.lastWinner = ["X", 0];
	this.fastGame = this.debug;
	if (this.debug) {
		this.players = {"B": 0, "W": 1}; //0 = human. 1+ = IA.
	} else {
		this.players = {"B": 0, "W": 0};
	}
	
	Audio.prototype.kind = "audio";
	Function.prototype.kind = "function";
	
	//Voice sample repository.
	this.VoicePath = "voice_es-ES/";
	this.Voice = {
		"welcome": new Audio(this.VoicePath + "welcome.ogg"),
		"check-mic": new Audio(this.VoicePath + "check-mic.ogg"),
		"check-mic-ok": new Audio(this.VoicePath + "check-mic-ok.ogg"),
		"check-mic-fail": new Audio(this.VoicePath + "check-mic-fail.ogg"),
		"not-working": new Audio(this.VoicePath + "not-working.ogg"),
		"start": new Audio(this.VoicePath + "start.ogg"),
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
		"play-menu": new Audio(this.VoicePath + "play-menu.ogg")
	}

	//A generic voice recognition object (despite there are other objects like this later).
	//Documentation: https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html
	this.voiceReceiver = new webkitSpeechRecognition();
	this.voiceReceiver.lang = "es-ES";
	this.voiceReceiver.onresult = function (event) {
		if (event.results.length > 0) {
			phrase = event.results[0][0].transcript;
			document.getElementById("voiceresult").value = phrase;
		}
	}
	
	//To execute at first if mic wasn't tested before. The user must say three words
	this.checkMicrophone = function() {
		this.microphoneWorks = false;
		var voiceTest = new webkitSpeechRecognition();
		voiceTest.lang = "es-ES";
		
		voiceTest.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results[0][0].transcript;
				results = parentThis.recognizePosition(phrase); //User has to pronounce "1, 2, 3", just like board positions.
				if (results.indexOf(-1) > -1) { //Number not recognized.
					queue = [parentThis.Voice["check-mic-fail"]];
					parentThis.failCount += 1;
				} else { //All clear.
					parentThis.microphoneWorks = true;
					queue = [parentThis.Voice["check-mic-ok"],
							 parentThis.Voice["general-help"],
							 parentThis.Voice["available-actions"],
							 parentThis.Voice["play-menu"],
							 parentThis.Voice["start"]];
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
		
		//First let's play the instructions, and then do all the action and open the mic.
		this.audioQueue([this.Voice["check-mic"]], 200, function() {
			var forTheCheck = setInterval(function() {
				if (parentThis.microphoneWorks == false) {
					if (parentThis.micBusy == false) {
						if (parentThis.failCount >= 3) { //Too much recognition errors? I quit.
							parentThis.audioQueue([parentThis.Voice["not-working"]], 1);
							clearInterval(forTheCheck);
						} else { //Start!
							parentThis.micBusy = true;
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
			for (var j in dictRows) { //Word by word through the recognition dictionaries.
				if (dictRows[j].toString().indexOf(words[i]) > -1) {
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
				return [this.Voice["available-actions"], this.Voice["play-menu"]];
				break;
				
			case "1":
				//Check.
				return this.queueBoard();
				break;
			
			case "2":
				//Instructions. How to put a chip.
				return [this.Voice["put-help"]];
				break;
			
			case "3":
				//Give up.
				var voice = [this.Voice[this.Color], this.Voice["surrender"], this.Voice["start"]];
				this.emptyBoard();
				this.changeTurn();
				return voice;
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
								setTimeout(function() { callback() }, delay);
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
	
	//An unfinished attempt to fit everything in a universal FIFO queue.
	this.waitForVoice = function(onResult, callback, audioQueue) {
		
		
		var voiceReceiver = new webkitSpeechRecognition();
		voiceReceiver.lang = parentThis.language;
		voiceReceiver.onresult = onResult();
		voiceReceiver.onerror = function(event) {
			if (event.error == "no-speech") {
				//Nothing on the mic.
				parentThis.failCount += 1;
				turnResult = "silence";
				parentThis.micBusy = false;
			}
		}
		
		var waitLoop = setInterval(function() {
			if (parentThis.micBusy == false) {
				//ToDo: Should I put failCount event here?
				parentThis.micBusy == true;
				callback();
				clearInterval(waitLoop);
			}
		}, 50);
	}
	
	//Board default state.
	this.emptyBoard = function() {
		this.Squares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
		
		//this.changeTurn();
	}
	
	//To check if there's a horizontal, vertical or diagonal line of the same color.
	this.theresLine = function() {
		var Squares = this.Squares;
		
		//Horizontal
		for (var Row in [0, 1, 2]) {
			if (Squares[Row][0] == Squares[Row][1] && Squares[Row][1] == Squares[Row][2]) {
				if (Squares[Row][0] != "X") {
					console.log(this.showBoard());
					var resultado = "Victoria horizontal para " + this.Color;
					console.log(resultado);
					return "horizontal";
				}
			}
		}
		
		//Vertical
		for (var Column in [0, 1, 2]) {
			if (Squares[0][Column] == Squares[1][Column] && Squares[1][Column] == Squares[2][Column]) {
				if (Squares[0][Column] != "X") {
					console.log(this.showBoard());
					var resultado = "Victoria vertical para " + this.Color;
					console.log(resultado);
					return "vertical";
				}
			}
		}
		
		//Diagonal
		var Cen = Squares[1][1];
		if ((Squares[0][0] == Cen && Cen == Squares[2][2]) || (Squares[0][2] == Cen && Cen == Squares[2][0])) {
			if (Cen != "X") {
				console.log(this.showBoard());
				var resultado = "Victoria diagonal para " + this.Color;
				console.log(resultado);
				return "diagonal";
			}
		}
		
		return 0;
	}
	
	//Run when board is full and no line condition is true.
	this.theresTie = function () {
		if (this.showBoard().indexOf("X") == -1) {
			console.log("Empate. :-D-:");
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
	
	//Forms an array with every empty position. Useful for AI.
	this.listEmptySquares = function () {
		var empties = [];
		var Squares = this.Squares;
		for (var row in Squares) {
			for (var column in Squares[row]) {
				if (!(this.isOccupied(row, column))) {
					empties.push([row, column]); //Row and column as a sub-array.
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
	//Or if dontChange, just return which would be the next player.
	this.changeTurn = function (dontChange) {
		dontChange = dontChange || false;
		var otherChip, otherColor;
		
		if (this.Chip == "B") {
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
		} else {
			console.log("Casilla ocupada.");
		}
	}
	
	//The core of a turn. Put the chip if the square is free, check if there's a line, and next turn (or not).
	this.basicTurnFlowWithReturn = function(Target) {
		var turnResult = "success";
		if (!(this.isOccupied(Target[0], Target[1]))) {
			this.putChip(this.Chip, Target[0], Target[1]); //Succesful chip.
			
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
		} else {
			console.log("Casilla ocupada."); //Oh my... That square was already taken.
			turnResult = "busy";
		}
		
		if (this.fastGame) {
			return turnResult; //Just say if there was a line or not.
		} else {
			var row = parseInt(Target[0]) + 1;
			var column = parseInt(Target[1]) + 1;
			return ["row" + row, "column" + column, turnResult]; //Pronounce position and result.
		}
	}
	
	//Useless right now for talkative game.
	this.humanTurnFlow = function () {
		console.log(this.showBoard());
		var Target = this.decideHuman();
		console.log(Target);
		this.basicTurnFlow(Target);
	}
	
	//First "AI" level. Pick a random empty square from a list.
	this.randomIA = function () {
		var empties = this.listEmptySquares();
		var choice = parseInt(Math.random() * empties.length); //Multiply random per possibilities. The old way.
		return empties[choice];
	}
	
	//Also deprecated. For the manual "Voice" button.
	this.turnFlowWithVoice = function(sample) {
		this.voiceReceiver.start();
		var Target = this.recognizePosition(sample);
		var turnResult = this.basicTurnFlow(Target);
		console.log(this.showBoard());
	}

	//The current core of voice play.
	this.turnFlowWithVoiceAuto = function() {
		var turnResult = "void"; //Default value. This variable will dictate voices played when the turn ends.
		var anotherVoice = new webkitSpeechRecognition();
		anotherVoice.lang = "es-ES";
		
		anotherVoice.onresult = function (event) {
			if (event.results.length > 0) {
				phrase1 = event.results[0][0].transcript;
				Target1 = parentThis.recognizePosition(phrase1);
				if (!(Target1[0] == -1 || Target1[1] == -1)) { //Both numbers are right?
					turnResult = parentThis.basicTurnFlowWithReturn(Target1); //Process them. Put chip if possible.
				} else { //They're not numbers!
					var command = parentThis.compareCommand(phrase1, dictPlayMenu); //Compare pronounced word with command list.
					if (command != "") {
						turnResult = parentThis.commandPlayMenu(command); //Play and/or do it.
					} else { //Command or position not recognized.
						parentThis.failCount += 1;
						turnResult = "unheard";
					}
					
				}
				console.log(parentThis.showBoard());
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
		
		//Mandatory timed loop to work over Javascript asynchronous nature. Deal with it (until I know a cleaner way).
		var waitPlease = setInterval(function () {
			if (parentThis.micBusy == false) { //Game started or microphone finished. Come.
				if (parentThis.failCount >= 4) { //Too many recognition errors. Quit loop and, therefore, application.
						parentThis.audioQueue([parentThis.Voice["not-working"]], 1);
						clearInterval(waitPlease);
				} else {
					parentThis.micBusy = true; //While true, speech rec won't start again.
					var voiceQueue = []; //Later it will be filled with voice samples to play.
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
						voiceQueue.push(parentThis.Voice["start"]);
					}
					if ("tie" == turnResult[2]) {
						voiceQueue.push(parentThis.Voice["start"]);
					} //Extra voice if game has ended.
					
					//Next turn for...
					voiceQueue.push(parentThis.Voice["turnfor"]); 
					voiceQueue.push(parentThis.Voice[parentThis.Color]);
					console.log(voiceQueue);
					
					//Now play everything. Later listen to the mic, or get the AI working, to put the next chip.
					parentThis.audioQueue(voiceQueue, 200, function() {
						switch (parentThis.players[parentThis.Chip]) {
							//case
							case 0:
								anotherVoice.start();
								break;
							case 1: //ARGH! Tougher than I thought. 
								Target = parentThis.randomIA();
								turnResult = parentThis.basicTurnFlowWithReturn(Target);
								parentThis.micBusy = false;
								break;
						}
						
					});
				}
			}
		}, 100);
		//Chromium stops recognizing when no voice detected during some seconds.
		
	}
	
	//Future interactiveness.
	this.mainMenu = function() {
		var words = dictMainMenu;
		//Mostrar descripción y opciones disponibles y esperar respuesta.
	}
	
	//Another attempt to put everything in a FIFO queue. Still no good.
	this.mainQueueProcess = function(queue) {
		
		var queueSeason = setInterval(function() {
			if (parentThis.mainBusy == false && queue.length > 0) {
				parentThis.mainBusy = true;
				var current = queue.push();
				switch (current.kind) { 
					case "audio":
						this.audioQueue(current, 200, function() { parentThis.mainBusy = false; });
						break;
					case "function":
						current();
						parentThis.mainBusy = false;
						break;
					case "voice":
						parentThis.micBusy = true;
						var voiceReceiver = new webkitSpeechRecognition();
						voiceReceiver.lang = parentThis.language;
						voiceReceiver.onresult = current[0]();
						
						if (current.length > 1) {
							voiceReceiver.onerror = current[1](event);
						} else {
							voiceReceiver.onerror = function(event) {
								if (event.error == "no-speech") {
									//Nothing on the mic.
									parentThis.failCount += 1;
									parentThis.mainQueue.push(parentThis.Voice["silence"]);
								}
							}
						}
						parentThis.mainQueue.push(current);
						parentThis.micBusy = false;
						parentThis.mainBusy = false;
						break;
						
				}
			}
		}, 100);
	}
	
	//To play visually, with alert windows.
	this.startGame = function () {
		this.emptyBoard();
		while (1) {
			this.humanTurnFlow();
		}
	}
	
	//Let the (real) game begin.
	this.startGameWithVoice = function () {
		if (this.microphoneWorks == false) {
			this.checkMicrophone();
		}
		var letsPlay = setInterval(function() {
			if (parentThis.microphoneWorks == true) {
				parentThis.turnFlowWithVoiceAuto();
				clearInterval(letsPlay);
			}
		}, 100);
		
	}
	
	this.Voice["welcome"].play();
}

var Tablero1 = new Board();
//Tablero1.startGame();
