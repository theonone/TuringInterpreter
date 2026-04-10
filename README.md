# Turing Machine Interpreter

A simple Turing machine interpreter written in TypeScript.

---

## Overview

This project allows you to write and execute Turing machine programs using a custom, human-readable syntax. It includes:

- A parser and validator for Turing machine code
- A dynamically expanding tape
- Step-by-step or full execution
- Helpful error messages with line references

---

## Code Syntax

Execution always starts from a state named `main`.

A program halts when:

- A transition uses direction `H` (halt), or
- The special state `exit` is reached

---

### State Definition

States are defined as follows:

```
state name:
    val => w_val, D, next_state
    val2 => ...
```

#### Rules:

- Each state must begin with the keyword `state`
- State names may contain: `a-z`, `0-9`, `_`
- A colon `:` must follow the state name
- Instructions must be indented with **exactly 4 spaces**

---

### Instructions

Each instruction follows this format:

```
val => w_val, D, next_state
```

#### Components:

- **`val`**  
  The character currently under the tape head (must be exactly 1 character)

- **`w_val`**  
  The character to write at the current tape position

- **`D` (Direction)**  
  One of:
  - `L` → move left
  - `R` → move right
  - `N` → no movement
  - `H` → halt execution

- **`next_state`**  
  The state to transition into after the instruction  
  (ignored if `D = H`, internally replaced with `exit`)

---

### Comments

You can add comments using:

```
// This is a comment
```

Everything after `//` on a line is ignored.

---

## Example

### Unary Addition

This example adds two unary numbers separated by `*`.

```
state main:
    1 => 1, R, main
    * => 1, R, main
    0 => 0, L, finisher

state finisher:
    1 => 0, H, exit // removes the last 1 and exits

// turing machine for adding two numbers in unary
// ...00011111*1111100...
// turns into
// ...0001111111111000...
```

---

## Tape Behavior

- The tape is conceptually infinite in both directions
- It expands automatically as the head moves
- Uninitialized cells contain a default character (configurable)

---

## API Reference

### `initialize(code: string): void`

Loads and compiles source code in one step. Equivalent to calling `load()` then `compile()`.  
Throws `TuringInterpreterException` on syntax or semantic errors.

---

### `load(code: string): void`

Stores source code without parsing. Must be followed by `compile()` before running.

### `compile(): void`

Parses and validates loaded code. Clears and rebuilds the internal state table on each call.  
Throws `TuringInterpreterException` if code is invalid, contains undefined state references, or is missing a `main` state.

---

### `setTape(input: string, defaultChar?: string, headPos?: number): void`

Sets tape contents and initial head position.

| Param         | Type     | Default | Description                               |
| ------------- | -------- | ------- | ----------------------------------------- |
| `input`       | `string` | —       | Initial tape contents                     |
| `defaultChar` | `string` | `"0"`   | Character used for unvisited cells        |
| `headPos`     | `number` | `0`     | Initial head index (non-negative integer) |

Throws `TuringInterpreterException` if `headPos` is negative or non-integer.

---

### `run(maxSteps: number): void`

Executes until the machine halts or `maxSteps` transitions are exceeded.  
Throws `TuringInterpreterException` if the step limit is hit, a state has no case for the current symbol, or the interpreter is not ready (code not compiled / tape not set).  
Read results with `getTape()` and `getHead()` after the call.

---

### `step(): boolean`

Executes a single transition. Returns `true` when the machine has halted, `false` otherwise.  
Intended for step-by-step execution — call in a loop and inspect tape state between steps.  
Throws `TuringInterpreterExceptionInternal` if called before `compile()` or `setTape()`.

---

### `getTape(): string`

Returns the current tape contents. Only covers cells that have been written to or expanded into.

### `getHead(): number`

Returns the current zero-based head index into the tape string.

---

### Error types

| Class                                | Cause                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `TuringInterpreterException`         | Invalid code, undefined states, missing cases, step limit exceeded       |
| `TuringInterpreterExceptionInternal` | Interpreter called in an invalid state (shouldn't occur in normal usage) |

---

## API Usage Example

```ts
const ti = new TuringInterpreter();

// Load and compile code
ti.initialize(code);

// Set tape (tape, default character, head position)
ti.setTape("111*111", "0", 0);

// Run program
ti.run(100000); // max steps

// Get tape and head
console.log(ti.getTape()); // "11111100"
console.log(ti.getHead());
```

Additionally, you can do step-by-step execution:

```ts
const ti = new TuringInterpreter();

// Load and compile code
ti.initialize(code);

// Set tape (tape, default character, head position)
ti.setTape("111*111", "0", 0);

// Run program
while (ti.step()) {
  console.log(ti.getTape());
  console.log(ti.getHead());
  ...
}
```

---

## Notes

- Each symbol must be a single character
- Each state can only define one instruction per symbol
- Programs may run infinitely unless halted explicitly or limited by `maxSteps`

---

## Future Ideas

- Step-by-step debugger UI
- Tape visualization
- Breakpoints
- Wildcard transitions (e.g. `_` for "any symbol")

---

## License

GPL v3. Basically, you can use, copy, modify, and distribute this code as you wish.
