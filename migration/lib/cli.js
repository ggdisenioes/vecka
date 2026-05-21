export function parseCliArgs(argv) {
  const options = {
    dryRun: false,
    limit: null,
    email: null,
    help: false,
  }

  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg.startsWith('--limit=')) {
      const limit = Number.parseInt(arg.slice('--limit='.length), 10)
      options.limit = Number.isFinite(limit) && limit > 0 ? limit : null
      continue
    }

    if (arg.startsWith('--email=')) {
      options.email = arg.slice('--email='.length).trim().toLowerCase() || null
    }
  }

  return options
}
