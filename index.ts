#!/usr/bin/env node

import http from 'http'
import clipboardy from 'clipboardy'
import lt from 'localtunnel'


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

async function createSessionClipboard(buff: Buffer) {
  const temporalServer = await new Promise<http.Server>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/clipped') {
        res.writeHead(200)
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

  console.log(`Share session on ${url.toString()}`)
  console.log(`Was copied the following script to the clipboard:`)
  console.log(``)
  console.log(`   ${terminalScript}`)
  console.log(``)
  console.log(`Press Ctrl+C to exit`)
}


async function main() {
  const buff = await captureStdin()

  await createSessionClipboard(buff)
}

main()
  .catch(console.error)


