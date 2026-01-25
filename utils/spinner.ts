/**
 * Simple native CLI spinner - no dependencies required!
 * Uses ANSI escape codes to create animated loading indicator
 */

export class Spinner {
  // private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  // Alternative frame sets you can use:
  // private frames = ["|", "/", "-", "\\"];
  // private frames = ["◐", "◓", "◑", "◒"];
  // private frames = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"]; // Counterclockwise
  private frames = ["⣾", "⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽"]; // Clockwise
  private currentFrame = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private text: string;

  constructor(text: string = "Thinking") {
    this.text = text;
  }

  /**
   * Start the spinner animation
   */
  start(): void {
    if (this.intervalId) return; // Already running

    // Hide cursor
    process.stdout.write("\x1B[?25l");

    this.intervalId = setInterval(() => {
      const frame = this.frames[this.currentFrame];

      // Clear line and write spinner
      process.stdout.write(`\r\x1B[K${frame} ${this.text}...`);

      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80); // 80ms for smooth animation
  }

  /**
   * Update spinner text while running
   */
  updateText(text: string): void {
    this.text = text;
  }

  /**
   * Stop the spinner and clear the line
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Clear the line
    process.stdout.write("\r\x1B[K");

    // Show cursor again
    process.stdout.write("\x1B[?25h");
  }

  /**
   * Stop spinner and display a success message (green checkmark)
   */
  succeed(message?: string): void {
    this.stop();
    if (message) {
      console.log(`\x1b[32m✓\x1b[0m ${message}`);
    }
  }

  /**
   * Stop spinner and display an error message (red X)
   */
  fail(message?: string): void {
    this.stop();
    if (message) {
      console.log(`\x1b[31m✗\x1b[0m ${message}`);
    }
  }
}

/**
 * Example usage:
 *
 * const spinner = new Spinner("Loading data");
 * spinner.start();
 * await someAsyncOperation();
 * spinner.succeed("Data loaded!");
 *
 * // Or just stop without message:
 * spinner.stop();
 */
