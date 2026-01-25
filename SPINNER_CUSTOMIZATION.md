# Spinner Customization Guide

Your app now has a native loading indicator that shows when the agent is thinking!

## What You'll See

```
⠋ Thinking...  ← Animated spinner while agent processes
```

The spinner automatically:
- ✅ Shows when the agent is working
- ✅ Hides the cursor during animation
- ✅ Clears itself before showing responses
- ✅ Shows the cursor again when done

## Customize the Spinner Style

Edit `utils/spinner.ts` line 7 to change the animation:

### Current (Dots Spinner):
```typescript
private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
```

### Alternative Styles:

**Classic Spinner:**
```typescript
private frames = ["|", "/", "-", "\\"];
```
Result: `| Thinking...` → `/ Thinking...` → `- Thinking...` → `\ Thinking...`

**Circular:**
```typescript
private frames = ["◐", "◓", "◑", "◒"];
```
Result: `◐ Thinking...` → `◓ Thinking...` → etc.

**Bouncing Bar:**
```typescript
private frames = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
```

**Simple Dots:**
```typescript
private frames = [".", "..", "...", ""];
```
Result: `Thinking.` → `Thinking..` → `Thinking...` → `Thinking`

**Arrows:**
```typescript
private frames = ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"];
```

**Box:**
```typescript
private frames = ["▖", "▘", "▝", "▗"];
```

## Change the Text

The spinner text is set in `index.ts`:

**Line 72** (initial greeting):
```typescript
const spinner = new Spinner("Starting");  // Change "Starting"
```

**Line 102** (user prompts):
```typescript
const spinner = new Spinner("Thinking");  // Change "Thinking"
```

You can use any text you want:
- `"Processing"`
- `"Working"`
- `"Loading"`
- `"Calculating"`
- `"Searching for flights"`

## Adjust Animation Speed

In `utils/spinner.ts` line 35, change the interval:

```typescript
}, 80); // 80ms = fast, smooth
```

**Slower:**
```typescript
}, 150); // Slower, more relaxed
```

**Faster:**
```typescript
}, 50); // Very fast
```

## Advanced: Context-Aware Spinner Text

You could make the spinner text change based on what the agent is doing:

```typescript
// In index.ts, you could detect intent first:
const intent = await classifyIntent(conversation);

let spinnerText = "Thinking";
if (intent === "flights") {
  spinnerText = "Searching for flights";
} else if (intent === "arithmetic") {
  spinnerText = "Calculating";
}

const spinner = new Spinner(spinnerText);
spinner.start();
```

## Disable the Spinner

If you don't want the spinner, just remove the spinner lines from `index.ts`:

```typescript
// Remove these:
const spinner = new Spinner("Thinking");
spinner.start();
// ... later
spinner.stop();
```

## How It Works

The spinner uses native Node.js features:
- `process.stdout.write()` - Write without newline
- `\r` - Carriage return (move cursor to start of line)
- `\x1B[K` - ANSI code to clear the line
- `\x1B[?25l` - Hide cursor
- `\x1B[?25h` - Show cursor
- `setInterval()` - Animation loop

No third-party dependencies required!
