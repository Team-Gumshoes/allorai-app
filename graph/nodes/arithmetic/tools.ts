import { add } from "../../../tools/arithmetic/add.js";
import { subtract } from "../../../tools/arithmetic/subtract.js";
import { multiply } from "../../../tools/arithmetic/multiply.js";
import { divide } from "../../../tools/arithmetic/divide.js";

export const arithmeticToolsByName = {
  add,
  subtract,
  multiply,
  divide,
};

export type ArithmeticToolName = keyof typeof arithmeticToolsByName;

export const arithmeticTools = Object.values(arithmeticToolsByName);
