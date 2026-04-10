import { TuringInterpreterException } from "./types";

class Tape {
  private tape: string = "";
  private head: number = 0;
  private defaultChar: string = "0";

  /**
   * Sets the tape's contents. Slots not explicitly defined in the tape will be filled with the default character.
   * @param tape The tape's contents
   */
  public setTape(tape: string) {
    this.tape = tape;
  }

  /**
   * Sets the tape's head position
   * @param head The position of the head
   */
  public setHead(head: number) {
    if (head < 0 || !Number.isInteger(head)) {
      throw new TuringInterpreterException(
        "Head position must be a positive integer",
      );
    }
    this.head = head;
  }

  /**
   * Sets the default character to use in non-explicitly defined slots
   * @param char The default character
   */
  public setDefaultChar(char: string) {
    this.defaultChar = char;
  }

  /**
   * Moves the head to the right
   */
  public right() {
    if (this.head == this.tape.length - 1) {
      this.tape += this.defaultChar;
    }
    this.head++;
  }

  /**
   * Moves the head to the left
   */
  public left() {
    if (this.head == 0) {
      this.tape = this.defaultChar + this.tape;
    } else {
      this.head--;
    }
  }

  /**
   * Returns the character at the current head position
   * @returns The character at the current head position
   */
  public read(): string {
    if (this.head >= this.tape.length) {
      this.tape += this.defaultChar.repeat(this.head - this.tape.length + 1);
    }
    return this.tape[this.head];
  }

  /**
   * Writes a character at the current head position
   * @param char The character to write
   */
  public write(char: string) {
    if (this.head >= this.tape.length) {
      this.tape += this.defaultChar.repeat(this.head - this.tape.length + 1);
    }
    this.tape =
      this.tape.slice(0, this.head) + char + this.tape.slice(this.head + 1); // what the fuck is wrong with this language
  }

  /**
   * Returns the tape's current contents
   * @returns The tape's current contents
   */
  public getTape(): string {
    return this.tape;
  }

  /**
   * Returns the tape's current head position
   * @returns The tape's current head position
   */
  public getHead(): number {
    return this.head;
  }
}

export default Tape;
