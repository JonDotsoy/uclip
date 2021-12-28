
interface Options {
  singleFlags?: string[];
}

export function buildOptions(args: string[], opts?: Options) {
  const iter = args[Symbol.iterator]()

  const params: string[] = []
  const options: { [key: string]: any } = {}

  do {
    const arg = iter.next()
    if (arg.done) break;

    if (arg.value.startsWith('-')) {
      const key = arg.value.startsWith('--') ? arg.value.slice(2) : arg.value.slice(1)
      if (opts?.singleFlags?.includes(key)) { options[key] = true; continue; }
      const value = iter.next().value
      if (options[key] === undefined) { options[key] = value; continue; }
      if (typeof options[key] === 'string') { options[key] = [value]; continue; }
      if (Array.isArray(options[key])) { options[key] = [...options[key], value]; continue; }
    } else {
      params.push(arg.value)
    }
  } while (true);

  return {
    params,
    options,
  };
}

export function buildArgs(args: string[], opts?: Options) {
  const splitterIndex = args.findIndex(arg => arg === '--')
  const params = splitterIndex === -1 ? args : args.slice(0, splitterIndex)
  const resParams = splitterIndex === -1 ? [] : args.slice(splitterIndex + 1)

  const resultParse = buildOptions(params, opts)

  return {
    ...resultParse,
    params: [...resultParse.params, ...resParams],
  }
}
