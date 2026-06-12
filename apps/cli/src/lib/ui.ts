import chalk from 'chalk';
import { loadConfig, loadAuth } from './config';

const isTTY = process.stdout.isTTY === true;
// Legacy Windows consoles (cmd.exe without Windows Terminal) render braille/unicode poorly
const useUnicode =
  process.platform !== 'win32' ||
  Boolean(process.env.WT_SESSION) ||
  process.env.TERM_PROGRAM === 'vscode';

export const sym = {
  ok: useUnicode ? '✔' : '√',
  err: useUnicode ? '✖' : '×',
  warn: useUnicode ? '⚠' : '!',
  info: useUnicode ? 'ℹ' : 'i',
  pointer: useUnicode ? '▸' : '>',
  arrow: useUnicode ? '→' : '->',
  bullet: '·',
  on: useUnicode ? '●' : '*',
  off: useUnicode ? '○' : 'o',
  sep: useUnicode ? '›' : '>',
};

/** Error type whose `hint` is rendered as a "Run <cmd>" suggestion by BaseCommand. */
export class CliError extends Error {
  constructor(message: string, readonly hint?: string) {
    super(message);
    this.name = 'CliError';
  }
}

// ─── Spinner ────────────────────────────────────────────────────────────────

const FRAMES = useUnicode
  ? ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  : ['-', '\\', '|', '/'];

let active: Spinner | null = null;

export class Spinner {
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private text = '';
  private onSigint = () => {
    this.clear();
    process.exit(130);
  };

  start(text: string): this {
    this.text = text;
    active = this;
    if (!isTTY) {
      console.log('  ' + chalk.dim(text));
      return this;
    }
    process.stdout.write('\x1b[?25l');
    process.once('SIGINT', this.onSigint);
    this.timer = setInterval(() => this.render(), 80);
    this.render();
    return this;
  }

  update(text: string): this {
    if (this.text === text) return this;
    this.text = text;
    if (!isTTY) console.log('  ' + chalk.dim(text));
    else this.render();
    return this;
  }

  private render(): void {
    const f = chalk.cyan(FRAMES[this.frame]);
    this.frame = (this.frame + 1) % FRAMES.length;
    process.stdout.write(`\r\x1b[2K  ${f} ${chalk.white(this.text)}`);
  }

  private clear(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    process.removeListener('SIGINT', this.onSigint);
    if (isTTY) process.stdout.write('\r\x1b[2K\x1b[?25h');
    if (active === this) active = null;
  }

  succeed(text?: string): void {
    this.clear();
    ok(text ?? this.text);
  }

  fail(text?: string): void {
    this.clear();
    err(text ?? this.text);
  }

  stop(): void {
    this.clear();
  }
}

export function spinner(text: string): Spinner {
  return new Spinner().start(text);
}

/** Stop whatever spinner is running (used before printing errors). */
export function stopSpinner(): void {
  active?.stop();
}

// ─── Output primitives ──────────────────────────────────────────────────────

export function header(): void {
  const config = loadConfig();
  const auth = loadAuth();

  const parts: string[] = [chalk.bold.cyan('kairos')];
  if (auth?.email) parts.push(chalk.dim(auth.email));
  if (config.defaultProjectName && config.defaultEnvName) {
    parts.push(
      chalk.white(config.defaultProjectName) + chalk.dim(` ${sym.sep} `) + chalk.green(config.defaultEnvName),
    );
  } else if (config.defaultEnvName) {
    parts.push(chalk.green(config.defaultEnvName));
  }

  console.log('\n  ' + parts.join(chalk.dim(`  ${sym.bullet}  `)) + '\n');
}

export function ok(msg: string): void {
  console.log('  ' + chalk.green(sym.ok) + ' ' + chalk.white(msg));
}

export function info(msg: string): void {
  console.log('  ' + chalk.cyan(sym.info) + ' ' + chalk.white(msg));
}

export function warn(msg: string): void {
  console.log('  ' + chalk.yellow(sym.warn) + ' ' + chalk.yellow(msg));
}

export function err(msg: string): void {
  console.log('  ' + chalk.red(sym.err) + ' ' + chalk.white(msg));
}

/** Subtle one-line notice for automatic state calibration (stale device cleanup etc). */
export function notice(msg: string): void {
  process.stderr.write('  ' + chalk.yellow(sym.warn) + ' ' + chalk.dim(msg) + '\n');
}

export function hint(text: string): void {
  console.log('  ' + chalk.dim(sym.arrow + ' ' + text));
}

/** "Run `cmd` — description" suggestion line. */
export function suggest(command: string, description?: string): void {
  console.log(
    '  ' + chalk.dim(sym.arrow + ' Run ') + chalk.cyan(command) + (description ? chalk.dim(' — ' + description) : ''),
  );
}

export function nextSteps(steps: Array<[string, string]>): void {
  console.log(chalk.dim('  Next'));
  const width = Math.max(...steps.map(([c]) => c.length)) + 4;
  for (const [command, description] of steps) {
    console.log('    ' + chalk.cyan(command.padEnd(width)) + chalk.dim(description));
  }
}

export function label(key: string, value: string): void {
  console.log('  ' + chalk.dim(key.padEnd(24)) + chalk.white(value));
}

export function row(cols: string[], widths: number[]): void {
  const line = cols.map((c, i) => c.padEnd(widths[i] ?? 0)).join('  ');
  console.log('  ' + line);
}

const RULE = useUnicode ? '─' : '-';

export function divider(width = 60): void {
  console.log(chalk.dim('  ' + RULE.repeat(width)));
}

export function blank(): void {
  console.log();
}
