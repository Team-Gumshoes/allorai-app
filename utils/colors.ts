/**
 * Native ANSI color codes for terminal output.
 * No third-party dependencies required!
 */

export const colors = {
  // Basic colors
  reset: "\x1b[0m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  orange: "\x1b[33;1m",

  // Bright/bold colors
  brightBlack: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m", // This is closest to orange
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
  brightOrange: "\x1b[93;1m",

  // Orange-like color (bright yellow is the closest)
  orange2: "\x1b[33;1m", // Bold yellow looks orange-ish
} as const;

/**
 * Colorize text for terminal output
 * @param text - Text to colorize
 * @param color - Color from the colors object
 * @returns Colorized text with reset code at the end
 */
export function colorize(
  text: string,
  color: keyof typeof colors = "brightCyan"
): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Example usage:
 *
 * console.log(colorize("This is orange text"));
 * console.log(colorize("This is red text", "red"));
 * console.log(colorize("This is bright green", "brightGreen"));
 *
 * Or use colors directly:
 * console.log(`${colors.orange}Agent:${colors.reset} Hello!`);
 */
