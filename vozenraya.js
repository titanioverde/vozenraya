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
	
	//Error control and options.
	if (window.location.search.indexOf("debug") > -1) {
		this.debug = true;
	} else {
		this.debug = false;
	}
	
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

	//A generic voice recognition object (despite there's "anotherVoice" further).
	this.voiceReceiver = new webkitSpeechRecognition();
	this.voiceReceiver.lang = "es-ES";
	this.voiceReceiver.onresult = function (event) {
		if (event.results.length > 0) {
			phrase = event.results[0][0].transcript;
			document.getElementById("voiceresult").value = phrase;
		}
	}
	
	this.checkMicrophone = function() {
		this.microphoneWorks = false;
		var voiceTest = new webkitSpeechRecognition();
		voiceTest.lang = "es-ES";
		voiceTest.onresult = function(event) {
			if (event.results.length > 0) {
				phrase = event.results[0][0].transcript;
				results = parentThis.recognizePosition(phrase);
				console.log(results);
				if (results.indexOf(-1) > -1) {
					queue = [parentThis.Voice["check-mic-fail"]];
					parentThis.failCount += 1;
				} else {
					parentThis.microphoneWorks = true;
					queue = [parentThis.Voice["check-mic-ok"],
							 parentThis.Voice["general-help"],
							 parentThis.Voice["available-actions"],
							 parentThis.Voice["play-menu"],
							 parentThis.Voice["start"]];
				}
				parentThis.audioQueue(queue, 100, function() { parentThis.micBusy = false; });
			}
		}
		
		voiceTest.onerror = function(event) {
			if (event.error == "no-speech" && parentThis.failCount < 3) {
				parentThis.failCount += 1;
				parentThis.audioQueue([parentThis.Voice["silence"]], 100, function() { parentThis.micBusy = false; });
			}
		}
		
		this.audioQueue([this.Voice["check-mic"]], 200, function() {
			var forTheCheck = setInterval(function() {
				//console.log(parentThis.microphoneWorks + " " + parentThis.micBusy);
				if (parentThis.microphoneWorks == false) {
					if (parentThis.micBusy == false) {
						//console.log("o.O");
						if (parentThis.failCount >= 3) {
							parentThis.audioQueue([parentThis.Voice["not-working"]], 1);
							clearInterval(forTheCheck);
						} else {
							parentThis.micBusy = true;
							voiceTest.start();
						}
					}
				} else {
					parentThis.failCount = 0;
					clearInterval(forTheCheck);
				}
			}, 60);
		});
		
	}
	
	this.showBoard = function () {
		var output = String(this.Squares[0]) + "\n" + String(this.Squares[1]) + "\n" + String(this.Squares[2]);
		return (output);
	}
	
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
	
	this.compareCommand = function(sample, dict) {
		var word = sample.toLowerCase().split(" ")[0];
		var result = "";
		for (var i in dict) {
			if (dict[i].toString().indexOf(word) > -1) {
				result = i;
			}
		}
		return result;
	}
	
	this.commandPlayMenu = function(index) {
		switch (index) {
			case "0":
				return [this.Voice["available-actions"], this.Voice["play-menu"]];
				break;
				
			case "1":
				//Check.
				return this.queueBoard();
				break;
			
			case "2":
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
	
	this.readBoard = function(toQueue) {
		var queue = [];
		var Squares = this.Squares;
		for (var i in Squares) {
			var currentRow = parseInt(i) + 1;
			queue.push(this.Voice["row" + String(currentRow)]);
			for (var j in Squares[i]) {
				queue.push(this.Voice[Squares[i][j]]);
			}
		}
		if (toQueue) {
			return queue;
		} else {
			this.audioQueue(queue, 200);
		}
		return 0;
	}
	
	this.queueBoard = function() {
		var queue = [];
		var Squares = this.Squares;
		for (var i in Squares) {
			var currentRow = parseInt(i) + 1;
			queue.push("row" + String(currentRow));
			for (var j in Squares[i]) {
				queue.push(Squares[i][j]);
			}
		}
		return queue;
	}
	
	
	this.audioQueue = function(queue, delay, callback) {
		delay = delay || 500;
		var i = 0;
		var playNow = function(audio) {
			audio.play();
			i += 1;
			var waitPlease = setInterval(function() {
				if (i < queue.length) {
					if (audio.ended) {
						setTimeout(function() { playNow(queue[i]) }, delay);
						clearInterval(waitPlease);
					}
				} else {
					if (typeof(callback) == "function") {
						var waitPlease2 = setInterval(function() {
							if (audio.ended) {
								//TODO: Is there really no cleaner way to do this?! T_T
								setTimeout(function() { callback() }, delay);
								clearInterval(waitPlease2);
							}
						}, 50);
					}
					clearInterval(waitPlease);
				}
			}, 50);
		}
		playNow(queue[i]);
	}
	
	this.waitForVoice = function(voiceCallback, audioQueue) {
		
		
		var voiceReceiver = new webkitSpeechRecognition();
		voiceReceiver.lang = parentThis.language;
		voiceReceiver.onresult = voiceCallback();
		voiceReceiver.onerror = function(event) {
			if (event.error == "no-speech") {
				//Nothing on the mic.
				parentThis.failCount += 1;
				turnResult = "silence";
				parentThis.micBusy = false;
			}
		}
	}
	
	this.emptyBoard = function() {
		this.Squares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
		
		//this.changeTurn();
	}
	
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
	
	this.theresTie = function () {
		if (this.showBoard().indexOf("X") == -1) {
			console.log("Empate. :-D-:");
			return "tie";
		}
		return 0;
	}
	
	this.decideHuman = function () {
		var Row = prompt(this.Color + ". Fila 1, 2 o 3?");
		Row -= 1;
		var Column = prompt(this.Color + ". Columna 1, 2 o 3?");
		Column -= 1;
		return [Row, Column];
	}
	
	this.isOccupied = function (Row, Column) {
		if (this.Squares[Row][Column] != "X") {
			return 1;
		} else {
			return 0;
		}
	}
	
	this.listEmptySquares = function () {
		var empties = [];
		var Squares = this.Squares;
		for (var row in Squares) {
			for (var column in Squares[row]) {
				if (!(this.isOccupied(row, column))) {
					empties.push([row, column]);
				}
			}
		}
		return empties;
	}
	
	this.putChip = function (Chip, Row, Column) {
		if (!(this.isOccupied(Row, Column))) {
			this.Squares[Row][Column] = Chip;
			return 1;
		} else {
			return 0;
		}
	}
	
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
	
	this.basicTurnFlowWithReturn = function(Target) {
		var turnResult = "success";
		if (!(this.isOccupied(Target[0], Target[1]))) {
			this.putChip(this.Chip, Target[0], Target[1]);
			
			var line = this.theresLine();
			var tie = this.theresTie();
			if (line) {
				turnResult = line;
			} else {
				if (tie) {
					turnResult = tie;
				}
			}
			
			if (line || tie) {
				this.emptyBoard();
			}
			this.changeTurn();
		} else {
			console.log("Casilla ocupada.");
			turnResult = "busy";
		}
		
		if (this.fastGame) {
			return turnResult;
		} else {
			var row = parseInt(Target[0]) + 1;
			var column = parseInt(Target[1]) + 1;
			return ["row" + row, "column" + column, turnResult];
		}
		
	}
	
	this.humanTurnFlow = function () {
		console.log(this.showBoard());
		var Target = this.decideHuman();
		console.log(Target);
		this.basicTurnFlow(Target);
	}
	
	this.randomIA = function () {
		var empties = this.listEmptySquares();
		var choice = parseInt(Math.random() * empties.length);
		return empties[choice];
	}
	
	this.turnFlowWithVoice = function(sample) {
		this.voiceReceiver.start();
		var Target = this.recognizePosition(sample);
		var turnResult = this.basicTurnFlow(Target);
		console.log(this.showBoard());
	}

	this.turnFlowWithVoiceAuto = function() {
		var turnResult = "void";
		var anotherVoice = new webkitSpeechRecognition();
		anotherVoice.lang = "es-ES";
		anotherVoice.onresult = function (event) {
			if (event.results.length > 0) {
				phrase1 = event.results[0][0].transcript;
				Target1 = parentThis.recognizePosition(phrase1);
				if (!(Target1[0] == -1 || Target1[1] == -1)) {
					turnResult = parentThis.basicTurnFlowWithReturn(Target1);
				} else {
					var command = parentThis.compareCommand(phrase1, dictPlayMenu);
					if (command != "") {
						turnResult = parentThis.commandPlayMenu(command);
					} else {
						parentThis.failCount += 1;
						turnResult = "unheard";
					}
					
				}
				console.log(parentThis.showBoard());
				parentThis.micBusy = false;
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
		
		var waitPlease = setInterval(function () {
			if (parentThis.micBusy == false) {
				if (parentThis.failCount >= 4) {
						parentThis.audioQueue([parentThis.Voice["not-working"]], 1);
						clearInterval(waitPlease);
				} else {
					parentThis.micBusy = true;
					var voiceQueue = [];
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
						voiceQueue.push(parentThis.Voice["start"]);
					}
					if ("tie" == turnResult[2]) {
						voiceQueue.push(parentThis.Voice["start"]);
					}
					voiceQueue.push(parentThis.Voice["turnfor"]);
					voiceQueue.push(parentThis.Voice[parentThis.Color]);
					console.log(voiceQueue);
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
	
	this.mainMenu = function() {
		var words = dictMainMenu;
		//Mostrar descripción y opciones disponibles y esperar respuesta.
	}
	
	this.startGame = function () {
		this.emptyBoard();
		while (1) {
			this.humanTurnFlow();
		}
	}
	
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
