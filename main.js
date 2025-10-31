/**
 * `map.find()` which for some reason doesn't already exists.
 * @param {Map} map The map to look into.
 * @param searchedVal The value to look for.
 */
function findMapValue(map, searchedVal) {
	for (const [key, value] of map.entries()) {
		if (value === searchedVal)
			return key;
	}
	return null;
}

/**
 * Error utility function
 * @param {String} msg 
 */
function error(msg) {
	console.error(msg);
	document.body.querySelector('output').innerHTML = "<span class='error'>Error: "+ msg +"</span>";
}

class InterpreterState {
	/** @type {Map<int, int>} */
	bracketCorrespondances;
	/** @type {string} */
	code;
	/** @type {Uint8Array} */
	memory;
	/** @type {int} */
	dataPtr = 0;
	/** @type {int} */
	instructionPtr;
	/** @type {bool} */
	functionsEnabled = false;
	
	constructor() {
		const input = document.body.querySelector('textarea');
		if(input === null)
			throw new Error("Element with id 'input' not defined.")
		
		this.code	= input.value;
		this.memory	= new Uint8Array(30000);
		this.dataPtr	= 0;
		this.instructionPtr = 0;
		this.bracketCorrespondances = new Map();
		
		this.readDirectives();
		this.#initializeBracketMap()
	}
	
	get instruction() {
		return this.code[this.instructionPtr];
	}
	get nextInstruction() {
		return this.code[this.instructionPtr + 1];
	}
	
	get cellValue() {
		return this.memory[this.dataPtr];
	}
	/** @param {int} val */
	set cellValue(val) {
		this.memory[this.dataPtr] = val;
	}
	
	#initializeBracketMap() {
		let encounteredOpeningBracketsPos = [];
		for(let i in this.code) {
			if(this.code[i] == '[')
				encounteredOpeningBracketsPos.push(i);
			if(this.code[i] == ']') {
				if(encounteredOpeningBracketsPos.length == 0){
					error("Unmatched ']' at index " + i.toString() + ".");
					return
				}
				const openingIndex = encounteredOpeningBracketsPos.pop();
				this.bracketCorrespondances.set(parseInt(openingIndex), parseInt(i));
			}
		}
		if(encounteredOpeningBracketsPos.length != 0) {
			error("Unmatched '[' at indexes " + encounteredOpeningBracketsPos.toString() + ".")
			return;
		}
	}
	
	readDirectives() {
		let fillWith = 0;
		let memsize = 30000;
		
		while(this.code.startsWith("!")) {
			if(this.code.startsWith("!*= "))		// read: "everthing is..."
				fillWith = parseInt(/\d+/.exec(this.code)[0]);
			
			else if(this.code.startsWith("!#Mc= "))	//read: "The memory cell count is..."
				memsize = parseInt(/\d+/.exec(this.code)[0]);
			
			else if(this.code.startsWith("!$()"))
				this.functionsEnabled = true;
			
			this.memory = new Uint8Array(memsize);
			this.code = this.code.slice(this.code.indexOf('\n')+1);
		}
		this.memory.fill(fillWith);
	}
}

/**
 * If they are enabled, interpret the functions.
 * @param {InterpreterState} state
 */
function interpretFunctions(state) {
	if(!state.functionsEnabled)
		return;
	
	for(const fun of ["<>", "="]) {
		if(
				state.code.length <= fun.length + state.instructionPtr + 2									// check overflow
				|| state.code.slice(state.instructionPtr + 1, fun.length + state.instructionPtr + 1) != fun	// check the name
				|| state.code[fun.length + state.instructionPtr + 1] != '('									// check the opening parn
		)
			continue;
		
		state.instructionPtr += fun.length + 2;
		switch(fun) {
			case "<>":
				if(!/\d/.test(state.instruction)) {
					error("<>() (moveto) expects 1 integer argument.");
					return false;
				}
				
				const addressStr = /\d+/.exec(state.code.slice(state.instructionPtr))[0];
				state.instructionPtr += addressStr.length;
				if(state.instruction != ')'){
					error("<>() (moveto) expects only 1 integer argument.");
					return false;
				}
				
				state.dataPtr = parseInt(addressStr);
				break;
			case "=":
				if(state.nextInstruction != ')') {
					error("=() (putchar) expects 1 charcter.");
					return false;
				}
				
				state.cellValue = state.instruction.charCodeAt(0);
				state.instructionPtr++;
				break;
			// there's no default since they don't pass the two first checks
		}
	}
	//instructionPtr should point on the closing parenthesis
}


/**
 * Executes the brainfuck with 
 * @param {InterpreterState} state 
 */
function execute_brainfuck(state = new InterpreterState()) {
	const output = document.body.querySelector('output');
	output.innerText = '';
	
	for(; state.instructionPtr < state.code.length; state.instructionPtr++) {
		switch(state.instruction) {
			case '>':
				if(++state.dataPtr >= state.memory.length) {
					error(`Memory pointer too large (over ${state.memory.length}).`)
					return;
				}
				break;
			case '<':
				if(--state.dataPtr < 0) {
					error("Memory pointer negative.")
					return;
				}
				break;
			case '+':
				state.cellValue++;
				break;
			case '-':
				state.cellValue--;
				break;
			case ',':
				state.cellValue = prompt("Enter a character.")[0].charCodeAt(0); //unicode? Who uses it?
				break;
			case '.':
				output.innerText += String.fromCharCode(state.cellValue);
				break;
			case '[':
				if(state.cellValue)
					break;
				
				state.instructionPtr = state.bracketCorrespondances.get(state.instructionPtr);
				break;
			case ']':
				if(!state.cellValue)
					break;
				
				const newPtr = findMapValue(state.bracketCorrespondances, state.instructionPtr);
				if(newPtr === null) {
					error(`Matching bracket not found for bracket at index "${state.instructionPtr}.`);
					return;
				}
				state.instructionPtr = newPtr;
				break;
			case '$':
				interpretFunctions(state);
			default:
				continue;
		}
	}
	console.info(state.memory);
}