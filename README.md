# Brainfuck but less annoying
A quick implementation of [Brainfuck](https://en.wikipedia.org/wiki/Brainfuck). <!--So many "fuck"s, the censors are gonna kill me-->
## Brainfuck features
> `.`  

Display the character stored at the pointer position.

> `,`

Prompt the user a character, only the first one is used and if it's a non-ascii one, take the first byte.

> `>` and `<`

Shift the data pointer left or right. It cannot go below 0 or above the [upper limit](#mc).

> `+` and `-`

Increment or decrement the value of the current cell (pointed at by the data pointer).

> `[` and `]`

The code inside the brackets will run as long as when the end (or start) is reached, the current cell holds a non zero value.

## Added stuff
### The interpreter directives
All dirctives are at the start of the file, begin by a `!` and are separated by new lines.
> `!*= integer`

Read as "everything equals", it sets every cell value to the given integer.
By default:
```
!*= 0
```

> <span id='mc'> `#Mc= integer`</span>

Read as "Memory cell count equals", it sets the upper limit of the cell pointer.
By default:
```
!#Mc= 30000
```

> `!$()`

Enables the functions.

### Functions
Some tasks were fastidious so they were shortened into predefiened functions. All functions are prefixed by a `$`. They will not run unless the `$()` is written.

> `$<>(integer)`

Also called the "moveto" function, it moves the data pointer to the corresponding data cell.

> `$=(character)`

Also called the "putchar" function, writes the ASCII code of corresponding character to the current memory cell. If the `$()` directive is active, **any character inside the parenthesis will not be interpreted as code**.