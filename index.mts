#!/usr/bin/env node

import clipboardy from 'clipboardy'
import { createReadStream, existsSync, fstat, readFileSync, statSync } from 'fs'
import http from 'http'
import lt from 'localtunnel'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { inspect } from 'util'
import { buildArgs } from './buildArgs.mjs'
import { pkg } from './pkg.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url));

function captureStdin() {
  return new Promise<Buffer>((resolve, reject) => {
    const buff: Buffer[] = []
    process.stdin.on('data', chunk => buff.push(chunk))
    process.stdin.once('error', reject)
    process.stdin.on('end', () => {
      resolve(Buffer.concat(buff))
    })
  })
}


function getPort(server: http.Server) {
  const address = server.address()

  if (typeof address === 'string' || address === null) return null
  if (typeof address === 'object' && typeof address.port === 'number') return address.port
  return null
}

interface SessionClipboardOptions {
  headers?: Record<string, string>
}

async function createSessionClipboard(buff: Buffer, options?: SessionClipboardOptions) {
  const temporalServer = await new Promise<http.Server>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/clipped') {
        res.setHeader('X-UClip', '1')
        if (options?.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            res.setHeader(key, value)
          })
        }
        res.statusCode = 200
        return res.end(buff)
      }
      res.statusCode = 404
      res.end()
    })
    server.on('error', reject)
    server.listen(undefined, '0.0.0.0', () => {
      resolve(server)
    })
  })

  const port = getPort(temporalServer)
  if (!port) throw new Error('Could not get port')

  const tunnel = await lt(port)

  const url = new URL(tunnel.url)

  url.pathname = '/clipped'

  const terminalScript = `curl -L ${url.toString()}`

  clipboardy.writeSync(terminalScript)

  console.log(`UClip ${pkg.version}`)
  console.log(`Share session on ${url.toString()}`)
  console.log(`Was copied the following script to the clipboard:`)
  console.log(``)
  console.log(`   ${terminalScript}`)
  console.log(``)
  console.log(`Press Ctrl+C to exit`)
}


async function main() {
  const argsBuilded = buildArgs(process.argv.slice(2), {
    singleFlags: [
      'h', 'help',
      'pkg-info',
    ],
  });

  if (argsBuilded.options['pkg-info']) {
    console.log(inspect(pkg, { depth: null, colors: true }))
    return
  }

  const shouldHelp = argsBuilded.options.help || argsBuilded.options.h
  const headersOpts: Record<string, string> = {};

  if (argsBuilded.options.header) {
    const headers = Array.isArray(argsBuilded.options.header) ? argsBuilded.options.header : [argsBuilded.options.header]

    headers.forEach(header => {
      const [key, value] = header.split(':')
      headersOpts[key] = value
    })
  }

  if (argsBuilded.options.H) {
    const headers = Array.isArray(argsBuilded.options.H) ? argsBuilded.options.H : [argsBuilded.options.H]

    headers.forEach(header => {
      const [key, value] = header.split(':')
      headersOpts[key] = value
    })
  }

  if (shouldHelp) {
    createReadStream(`${__dirname}/help.txt`).pipe(process.stdout)
    return;
  }

  const proposalFile = argsBuilded.params[0];

  if (proposalFile) {
    if (!existsSync(proposalFile)) {
      console.error(`File not found: ${proposalFile}`)
      process.exit(1)
    }
    if (!statSync(proposalFile).isFile()) {
      console.error(`Not a file: ${proposalFile}`)
      process.exit(1)
    }
  }

  const isLoadFile = !!proposalFile

  const buff = isLoadFile ? readFileSync(proposalFile) : await captureStdin()

  await createSessionClipboard(buff, { headers: headersOpts })
}

main()
  .catch(console.error)


