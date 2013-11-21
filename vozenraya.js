var dict1 = ["uno", "1"];
var dict2 = ["dos", "2"];
var dict3 = ["tres", "3"];

var dictA = ["a", "ah"];
var dictB = ["b", "be"];
var dictC = ["c", "ce"];

var dictRows = [dict1, dict2, dict3];
var dictColumns = [dictA, dictB, dictC];

var dictStart = ["comenzar"];
var dictHuman = ["humano"];
var dictCPU = ["ordenador"];

var dictMainMenu = [dictStart, dictHuman, dictCPU];

var dictCheck = ["revisar"];
var dictPut = ["colocar"];
var dictGiveUp = ["abandonar"];

var dictPlayMenu = [dictCheck, dictPut, dictGiveUp];


var Board = function (Chip) {
	this.Chip = Chip || "W";
	if (Chip == "W") {
		this.Color = "Whites";
	} else {
		this.Chip = "B";
		this.Color = "Blacks";
	}
	this.Squares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
	
	var parentThis = this; //Never forget the main object.
	
	this.VoicePath = "voice_es-ES/";
	this.Voice = {
		"row1": new Audio(this.VoicePath + "row1.ogg"),
		"row2": new Audio(this.VoicePath + "row2.ogg"),
		"row3": new Audio(this.VoicePath + "row3.ogg"),
		"X": new Audio(this.VoicePath + "empty.ogg"),
		"W": new Audio(this.VoicePath + "white.ogg"),
		"B": new Audio(this.VoicePath + "black.ogg"),
		"turnfor": new Audio(this.VoicePath + "turnfor.ogg")
	}

	this.voiceReceiver = new webkitSpeechRecognition();
	this.voiceReceiver.lang = "es-ES";
	this.voiceReceiver.onresult = function (event) {
		if (event.results.length > 0) {
			phrase = event.results[0][0].transcript;
			document.getElementById("voiceresult").value = phrase;
		}
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
		console.log(results.toString());
		return (results);
	}
	
	this.readBoard = function() {
		var queue = [];
		var Squares = this.Squares;
		for (var i in Squares) {
			var currentRow = parseInt(i) + 1;
			queue.push(this.Voice["row" + String(currentRow)]);
			for (var j in Squares[i]) {
				queue.push(this.Voice[Squares[i][j]]);
			}
		}
		this.audioQueue(queue, 200);
	}
	
	
	this.audioQueue = function(queue, delay, callback) {
		//TODO: delay for the next item.
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
	
	this.emptyBoard = function () {
		this.Squares = [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]];
		
		if (!(this.Chip in ["W", "B"])) {
			this.Chip = "W";
			this.Color = "White";
		}
		console.log("Another game.");
	}
	
	this.theresLine = function () {
		var Squares = this.Squares;
		
		//Horizontal
		for (var Row in [0, 1, 2]) {
			if (Squares[Row][0] == Squares[Row][1] && Squares[Row][1] == Squares[Row][2]) {
				if (Squares[Row][0] != "X") {
					console.log(this.showBoard());
					var resultado = "Victoria horizontal para " + this.Color;
					console.log(resultado);
					document.getElementById("contenido").appendChild(document.createTextNode("<br />" + resultado));
					return 1;
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
					document.getElementById("contenido").appendChild(document.createTextNode("<br />" + resultado));
					return 1;
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
				document.getElementById("contenido").appendChild(document.createTextNode("<br />" + resultado));
				return 1;
			}
		}
		
		return 0;
	}
	
	this.theresTie = function () {
		if (this.showBoard().indexOf("X") == -1) {
			console.log("Empate. :-D-:");
			return 1;
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
	
	this.putChip = function (Chip, Row, Column) {
		if (!(this.isOccupied(Row, Column))) {
			this.Squares[Row][Column] = Chip;
			return 1;
		} else {
			return 0;
		}
	}
	
	this.changeTurn = function () {
		if (this.Chip == "B") {
			this.Chip = "W";
			this.Color = "Whites"
		} else {
			this.Chip = "B";
			this.Color = "Blacks";
		}
	}
	
	//TODO: Programar otro flujo para entrada por voz.
	this.basicTurnFlow = function(Target) {
		if (!(this.isOccupied(Target[0], Target[1]))) {
			this.putChip(this.Chip, Target[0], Target[1]);
			if (this.theresLine() || this.theresTie()) {
				this.emptyBoard();
			}
			//document.getElementById("contenido").appendChild(document.createTextNode("<br />" + this.showBoard()));
			this.changeTurn();
		} else {
			console.log("Casilla ocupada.");
		}
	}
	
	this.humanTurnFlow = function () {
		console.log(this.showBoard());
		var Target = this.decideHuman();
		console.log(Target);
		this.basicTurnFlow(Target);
	}
	
	this.turnFlowWithVoice = function(sample) {
		this.voiceReceiver.start();
		var Target = this.recognizePosition(sample);
		this.basicTurnFlow(Target);
		console.log(this.showBoard());
	}

	this.turnFlowWithVoiceAuto = function() {
		var anotherVoice = new webkitSpeechRecognition();
		var micBusy = false;
		anotherVoice.lang = "es-ES";
		anotherVoice.onresult = function (event) {
			if (event.results.length > 0) {
				phrase1 = event.results[0][0].transcript;
				Target1 = parentThis.recognizePosition(phrase1);
				parentThis.basicTurnFlow(Target1);
				console.log(parentThis.showBoard());
				micBusy = false;
			}
		}
		
		var waitPlease = setInterval(function () {
				if (micBusy == false) {
					micBusy = true;
					var voiceQueue = [parentThis.Voice["turnfor"], parentThis.Voice[parentThis.Chip]];
					parentThis.audioQueue(voiceQueue, 200, function() { anotherVoice.start(); });
				}
			}, 100);
		//Chromium detiene el bucle cuando no detecta voz durante unos segundos.
		
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
	
}

var Tablero1 = new Board();
//Tablero1.startGame();
