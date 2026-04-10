export type MoveDirection = "L" | "R" | "N" | "H";

export interface IState {
  name: string;
  cases: Map<string, ICase>;
  atLine: number;
}

export interface ICase {
  move: MoveDirection;
  nextName: string; // state name
  writeVal: string;
  atLine: number;
}

// for errors caused by the user/code
export class TuringInterpreterException extends Error {}

// for errors not related to the user
export class TuringInterpreterExceptionInternal extends Error {}
