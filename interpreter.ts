import Tape from "./tape";
import {
  IState,
  MoveDirection,
  TuringInterpreterException,
  TuringInterpreterExceptionInternal,
} from "./types";

class TuringInterpreter {
  private tape: Tape = new Tape();
  private states: Map<string, IState> = new Map();
  private lines: string[] = [];
  private isLoaded: boolean = false;
  private isPrepared: boolean = false;
  private isTapeSet: boolean = false;
  private currentState: IState = { name: "", cases: new Map(), atLine: 0 };

  private checkCanRun(): void {
    if (!this.isLoaded) {
      throw new TuringInterpreterExceptionInternal(
        "No code loaded, nothing to run",
      );
    }
    if (!this.isPrepared) {
      throw new TuringInterpreterExceptionInternal(
        "Code not prepared, cannot run",
      );
    }
    if (!this.isTapeSet) {
      throw new TuringInterpreterExceptionInternal("Tape not set, cannot run");
    }
  }

  private throwCodeError(line: number, error: string) {
    throw new TuringInterpreterException(`Error on line ${line}: ${error}`);
  }

  /**
   * Loads code into the interpreter, does minimal preprocessing
   * @param code The code to be loaded into the interpreter.
   */
  public load(code: string): void {
    this.lines = code.split("\n");
    this.isLoaded = true;
  }

  /**
   * Parses the code, validates it, and compiles it into a map of states
   * @throws TuringInterpreterException if:
   * 1. states are indented
   * 2. state names are invalid: empty, duplicate, or characters other than letters, underscores, and numbers
   * 3. missing colon after state name
   * 4. characters after colon
   * 5. instructions (cases) declared before any states
   * 6. duplicate case
   * 7. invalid case (must follow the format: "char => char to write, L/R/N/H, nextState")
   * 8. instruction references an undefined state
   * 9. instruction not properly indented
   * 10. no state "main" found
   */
  public compile(): void {
    this.states.clear();
    let stateName: string = "";
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].split("//")[0]; // ignore comments
      const trimmedLine = line.trim();

      if (trimmedLine === "") continue;

      if (trimmedLine.startsWith("state")) {
        if (!line.startsWith("state")) {
          this.throwCodeError(i + 1, "States must not have indents");
        }
        const parts = trimmedLine.split(" ").filter((part) => part !== "");

        if (parts.length === 1 || (parts.length === 2 && parts[1] === ":")) {
          this.throwCodeError(i + 1, "Invalid state declaration: Missing name");
        }
        stateName = parts[1].toLowerCase();
        let hasColon = false;
        if (stateName.charAt(stateName.length - 1) === ":") {
          hasColon = true;
          stateName = stateName.slice(0, stateName.length - 1);
        }
        if (parts.length >= 3 && parts[2].startsWith(":")) {
          hasColon = true;
        }
        if (!hasColon) {
          this.throwCodeError(
            i + 1,
            "Invalid state declaration: Missing colon after the name",
          );
        }

        if (parts.length > 3 || (parts.length === 3 && parts[2] !== ":")) {
          this.throwCodeError(
            i + 1,
            "Invalid state declaration: Colon is expected to be the last character",
          );
        }

        for (let j = 0; j < stateName.length; j++) {
          const charCode = stateName.charCodeAt(j);
          if (
            (charCode < 97 || charCode > 122) &&
            stateName[j] !== "_" &&
            (charCode < 48 || charCode > 57)
          ) {
            this.throwCodeError(
              i + 1,
              "Invalid state name: " +
                stateName +
                ". Only a-z, 0-9, and _ are allowed",
            );
          }
        }

        if (this.states.has(stateName)) {
          this.throwCodeError(
            i + 1,
            `State ${stateName} already exists at line ${this.states.get(stateName)?.atLine}`,
          );
        }
        this.states.set(stateName, {
          name: stateName,
          cases: new Map(),
          atLine: i + 1,
        });
      } else {
        if (stateName === "") {
          this.throwCodeError(i + 1, "No state declared before instruction");
        }
        const instructionSplit = trimmedLine.split("=>");
        if (!line.startsWith("    ") || line.at(4) === " ") {
          this.throwCodeError(
            i + 1,
            "Instructions must have 4 whitespace indents",
          );
        }
        if (instructionSplit.length !== 2) {
          this.throwCodeError(
            i + 1,
            'Invalid instruction format: There must be exactly one "=>"',
          );
        }
        const val = instructionSplit[0].trim();
        if (val.length !== 1) {
          this.throwCodeError(
            i + 1,
            "Invalid instruction format: Invalid case",
          );
        }
        const args = instructionSplit[1]
          .trim()
          .split(",")
          .map((arg) => arg.trim());
        if (args.length !== 3 && !(args.length === 2 && args[1] === "H")) {
          this.throwCodeError(
            i + 1,
            "Invalid instruction format: Invalid number of arguments, expected 3 separated by commas or 2 separated by commas if direction is H (next state isn't required)",
          );
        }
        const toWrite = args[0];
        const direction = args[1];
        let nextState = direction === "H" ? "exit" : args[2].toLowerCase();
        if (
          direction !== "L" &&
          direction !== "R" &&
          direction !== "N" &&
          direction !== "H"
        ) {
          this.throwCodeError(
            i + 1,
            "Invalid instruction format: Invalid direction",
          );
        }
        if (toWrite.length !== 1) {
          this.throwCodeError(
            i + 1,
            "Invalid instruction format: Invalid character to write",
          );
        }
        if (this.states.get(stateName)?.cases.get(val) !== undefined) {
          this.throwCodeError(
            i + 1,
            "Invalid instruction format: Case already exists",
          );
        }
        this.states.get(stateName)!.cases.set(val, {
          move: direction as MoveDirection,
          nextName: nextState,
          writeVal: toWrite,
          atLine: i + 1,
        });
      }
    }

    let hasMain = false;

    for (const [stateName, state] of this.states) {
      console.log(stateName + ":");

      if (stateName === "main") {
        hasMain = true;
      }
      for (const [key, value] of state.cases) {
        console.log(
          "    " +
            key +
            " => " +
            value.writeVal +
            " " +
            value.move +
            " " +
            value.nextName,
        );
        if (!this.states.has(value.nextName) && value.nextName !== "exit") {
          throw new TuringInterpreterException(
            `Line ${value.atLine}: State ${value.nextName} is not defined`,
          );
        }
      }
    }

    if (!hasMain) {
      throw new TuringInterpreterException(
        "No state called main found, which is required to start the program from",
      );
    }

    this.isPrepared = true;
  }
  /**
   * Sets the tape, which is the input for the turing machine
   * @param input The input for the turing machine (like "111*111" for a unary adder)
   * @param defaultChar The default character to use in non-explicitly defined slots (default: "0")
   * @param headPos The position of the head on the tape (default: 0)
   */
  public setTape(
    input: string,
    defaultChar: string = "0",
    headPos: number = 0,
  ): void {
    this.tape.setTape(input);
    this.tape.setDefaultChar(defaultChar);
    this.tape.setHead(headPos);
    this.isTapeSet = true;
  }

  /**
   * Runs the turing machine
   * @param maxSteps max amount of steps the program can make before being terminated (prevents an infinite loop)
   * @throws TuringInterpreterExceptionInternal if the program is not prepared. You must either call (initialize() and setTape()) or (load(), compile(), and setTape()) first
   * @throws TuringInterpreterException if the maxSteps is exceeded or if a state doesn't handle a value
   */
  public run(maxSteps: number): void {
    this.checkCanRun();
    let stepsMade = 0;
    this.currentState = this.states.get("main")!;

    while (!this.unsafeStep()) {
      stepsMade++;
      if (stepsMade > maxSteps) {
        throw new TuringInterpreterException(
          "Max steps exceeded (" + maxSteps + ")",
        );
      }
    }
  }

  /**
   * Initializes the interpreter. Same as load() + compile()
   * @param code The code to be loaded into the interpreter
   * @throws TuringInterpreterException if the code is invalid (see compile() for details)
   */
  public initialize(code: string): void {
    this.load(code);
    this.compile();
  }

  /**
   * Runs one step of the turing machine
   * @returns true if the program has finished, false otherwise
   * @throws TuringInterpreterExceptionInternal if the program is not prepared. You must either call (initialize() and setTape()) or (load(), compile(), and setTape()) first
   * @throws TuringInterpreterException if a state doesn't handle a value
   */
  public step(): boolean {
    this.checkCanRun();
    if (this.currentState.name === "") {
      this.currentState = this.states.get("main")!;
    }
    return this.unsafeStep();
  }
  // same as step, but doesn't check if can run
  private unsafeStep(): boolean {
    const charAtTape = this.tape.read();
    if (!this.currentState.cases.has(charAtTape)) {
      this.throwCodeError(
        this.currentState.atLine,
        `State "${this.currentState.name}" does not have a case for "${charAtTape}"`,
      );
    }
    const args = this.currentState.cases.get(charAtTape)!;
    this.tape.write(args.writeVal);
    if (args.move === "L") {
      this.tape.left();
    } else if (args.move === "R") {
      this.tape.right();
    } else if (args.move === "H") {
      return true;
    }
    if (args.nextName === "exit") {
      return true;
    }
    this.currentState = this.states.get(args.nextName)!;

    return false;
  }

  /**
   * Returns the current tape contents as a string
   * @returns The current tape contents
   */
  public getTape(): string {
    return this.tape.getTape();
  }

  /**
   * Returns the current head position on the tape
   * @returns The current head position
   */
  public getHead(): number {
    return this.tape.getHead();
  }

  /**
   * Returns the states of the turing machine. Not really needed for normal use.
   * @returns The states of the turing machine
   */
  public getStates(): Map<string, IState> {
    return this.states;
  }
}

export default TuringInterpreter;
