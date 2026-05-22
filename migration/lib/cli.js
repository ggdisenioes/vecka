export function parseCliArgs(argv) {
  const options = {
    dryRun: false,
    limit: null,
    email: null,
    inventory: false,
    tierSlug: null,
    sourceIds: [],
    uploadsDir: null,
    uploadsBaseUrl: null,
    status: null,
    help: false,
  }

  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--inventory') {
      options.inventory = true
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
      continue
    }

    if (arg.startsWith('--tier-slug=')) {
      options.tierSlug = arg.slice('--tier-slug='.length).trim() || null
      continue
    }

    if (arg.startsWith('--source-ids=')) {
      options.sourceIds = arg
        .slice('--source-ids='.length)
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value > 0)
      continue
    }

    if (arg.startsWith('--uploads-dir=')) {
      options.uploadsDir = arg.slice('--uploads-dir='.length).trim() || null
      continue
    }

    if (arg.startsWith('--uploads-base-url=')) {
      options.uploadsBaseUrl = arg.slice('--uploads-base-url='.length).trim() || null
      continue
    }

    if (arg.startsWith('--status=')) {
      options.status = arg.slice('--status='.length).trim().toLowerCase() || null
    }
  }

  return options
}
