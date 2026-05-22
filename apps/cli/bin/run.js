#!/usr/bin/env node

// Suppress oclif's internal single-command-CLI lookup warning (harmless false positive)
process.on('warning', (w) => {
  if (String(w.message).includes('SINGLE_COMMAND_CLI')) return;
  process.stderr.write(w.stack + '\n');
});

const argv = process.argv.slice(2);

if (argv.length === 0) {
  showStatus();
} else {
  const { run, flush, handle } = require('@oclif/core');
  run(argv).then(flush).catch(handle);
}

function showStatus() {
  const chalk = require('chalk');
  const { loadAuth, loadConfig } = require('../dist/lib/config');
  const pkg = require('../package.json');

  let auth, config;
  try { auth = loadAuth(); } catch { auth = null; }
  try { config = loadConfig(); } catch { config = { apiUrl: '' }; }

  console.log();
  console.log(
    '  ' + chalk.bold.white('kairos') +
    chalk.dim('  ·  E2EE secrets manager  ·  ') +
    chalk.dim('v' + pkg.version),
  );
  console.log();

  const loginLine = (auth && auth.accessToken)
    ? chalk.green('●') + '  ' + chalk.dim('logged in as') + '   ' + chalk.cyan(auth.email ?? auth.userId)
    : chalk.yellow('●') + '  ' + chalk.dim('logged in as') + '   ' + chalk.yellow('not logged in') + chalk.dim(' — run ') + chalk.cyan('kairos login');

  const envLine = config.defaultEnvName
    ? chalk.green('●') + '  ' + chalk.dim('environment') + '    ' + chalk.bold(config.defaultProjectName ?? '') + ' ' + chalk.dim('›') + ' ' + chalk.bold.green(config.defaultEnvName)
    : chalk.dim('○') + '  ' + chalk.dim('environment') + '    ' + chalk.dim('none — run ') + chalk.cyan('kairos switch');

  const deviceLine = config.deviceId
    ? chalk.green('●') + '  ' + chalk.dim('device') + '         ' + chalk.cyan(config.deviceName ?? config.deviceId.slice(0, 8) + '…')
    : chalk.dim('○') + '  ' + chalk.dim('device') + '         ' + chalk.dim('not registered — run ') + chalk.cyan('kairos switch');

  console.log('  ' + loginLine);
  console.log('  ' + envLine);
  console.log('  ' + deviceLine);
  console.log();

  const line = chalk.dim('  ' + '─'.repeat(45));
  console.log(line);
  console.log();
  console.log('  ' + chalk.bold('COMMANDS'));
  console.log();

  const cmds = [
    ['login',                      'Sign in to your account'],
    ['logout',                     'Sign out'],
    ['switch',                     'Switch active project / environment'],
    ['',                           chalk.dim('  (registers device if not yet approved)')],
    ['secrets',                    'Decrypt and display secrets'],
    ['secrets -g',                 'Write secrets to .env in current directory'],
    ['secrets -g FILENAME',        'Write secrets to FILENAME'],
    ['environments list',          'List all environments'],
    ['device DEVICE_NAME',         'Set a name for this device'],
  ];

  for (const [cmd, desc] of cmds) {
    if (!cmd) {
      console.log('    ' + desc);
    } else {
      console.log('    ' + chalk.cyan(cmd.padEnd(30)) + chalk.dim(desc));
    }
  }

  console.log();
  console.log(line);
  console.log(chalk.dim('\n  Run ' + chalk.white('kairos <command> --help') + ' for details.\n'));
}
