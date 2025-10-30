/*
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
function execute_brainfuck() {
	var code	 = document.body.querySelector('#input').value;
	const output = document.body.querySelector('output');
	output.innerText = '';
	
	/** Error utility function */
	function error(msg) {
		console.error(msg);
		output.innerHTML = "<span class='error'>Error: "+ msg +"</span>";
	}
	
	let memory = new Uint8Array(30000);
	let memPtr = 0;
	
	//read "preprocessor directives"
	let funEnabled = false;
	{
		let fillWith = 0;
		let memsize = 30000;
		
		while(code.startsWith("!")) {
			if(code.startsWith("!init "))
				fillWith = parseInt(/\d+/.exec(code)[0]);
			else if(code.startsWith("!memsize "))
				memsize = parseInt(/\d+/.exec(code)[0]);
			else if(code.startsWith("!enablefunctions"))
				funEnabled = true;
			
			memory = new Uint8Array(memsize);
			code = code.slice(code.indexOf('\n')+1);
		}
		memory.fill(fillWith);
	}
	
	//initialize bracketMap[] (index opening bracket -> index closing bracket)
	let bracketMap = new Map();
	{
		let encounteredOpeningBracketsPos = [];
		for(let i in code) {
			if(code[i] == '[')
				encounteredOpeningBracketsPos.push(i);
			if(code[i] == ']') {
				if(encounteredOpeningBracketsPos.length == 0){
					error("Unmatched ']' at index " + i.toString() + ".");
					return
				}
				const openingIndex = encounteredOpeningBracketsPos.pop();
				bracketMap.set(parseInt(openingIndex), parseInt(i));
			}
		}
		if(encounteredOpeningBracketsPos.length != 0){
			error("Unmatched '[' at indexes " + encounteredOpeningBracketsPos.toString() + ".")
			return;
		}
	}
	
	//main loop
	for(let instructionPtr = 0; instructionPtr < code.length; instructionPtr++) {
		switch(code[instructionPtr]) {
			case '>':
				if(++memPtr >= memory.length) {
					error(`Memory pointer too large (over ${memory.length}).`)
					return;
				}
				break;
			case '<':
				if(--memPtr < 0) {
					error("Memory pointer negative.")
					return;
				}
				break;
			case '+':
				memory[memPtr]++;
				break;
			case '-':
				memory[memPtr]--;
				break;
			case ',':
				memory[memPtr] = prompt("Enter a character.")[0].charCodeAt(0); //unicode? Who uses it?
				break;
			case '.':
				output.innerText += String.fromCharCode(memory[memPtr]);
				break;
			case '[':
				if(memory[memPtr])
					break;
				
				instructionPtr = bracketMap.get(instructionPtr);
				break;
			case ']':
				if(!memory[memPtr])
					break;
				
				const newPtr = findMapValue(bracketMap, instructionPtr);
				if(newPtr === null) {
					error("Matching bracket not found for bracket at index " + instructionPtr + ".");
					console.debug(bracketMap);
					return;
				}
				instructionPtr = newPtr;
				break;
			case '$':
				if(!funEnabled)
					break;
				for(const fun of ["moveto", "putchar"]) {
					if(code.length <= fun.length + instructionPtr + 2)
						continue;
					if(code.slice(instructionPtr + 1, fun.length + instructionPtr + 1) != fun || code[fun.length + instructionPtr + 1] != '(')
						continue;
					
					instructionPtr += fun.length + 2;
					switch(fun){
						case "moveto":
							if(!/\d/.test(code[instructionPtr])) {
								error("moveto() expects 1 integer argument.");
								return;
							}
							
							const addressStr = /\d+/.exec(code.slice(instructionPtr))[0];
							instructionPtr += addressStr.length;
							if(code[instructionPtr] != ')'){
								error("moveto() expects only 1 integer argument.");
								return;
							}
							
								
							memPtr = parseInt(addressStr);
							break;
						case "putchar":
							if(code[instructionPtr+1] != ')') {
								error("put_char() expects 1 charcter.");
								return;
							}
							
							console.log(code[instructionPtr]);
							memory[memPtr] = code[instructionPtr].charCodeAt(0);
							instructionPtr++;
							break;
						default:
							error(`Unknown function "${fun}()".`);
							return;
					}
					//instructionPtr should point on the closing parenthesis
					//if adding something in the case, declare a variable to see if the exit was because of an error.
					break;
				}
					
			default:
				continue;
		}
	}
	console.info(memory);
}