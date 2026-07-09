import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import { curlGet } from './curl'

// gytennis TLS 체인 문제(Node fetch 실패, curl 성공) 때문에 검증 HTTP는 curl로 통일한다.
// 여기서는 로컬 서버로 curl 래퍼의 계약(상태코드·최종URL·본문·리다이렉트 추적)을 검증한다.
let server: Server
let base: string

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/ok') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<html>잠원 한강공원 테니스장</html>')
    } else if (req.url === '/redirect') {
      res.writeHead(302, { Location: '/login' })
      res.end()
    } else if (req.url === '/login') {
      res.writeHead(200)
      res.end('<html>login page</html>')
    } else {
      res.writeHead(404)
      res.end('not found')
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  base = typeof address === 'object' && address ? `http://127.0.0.1:${address.port}` : ''
})

afterAll(() => {
  server.close()
})

describe('curlGet', () => {
  it('상태코드·최종URL·본문을 반환한다', async () => {
    const result = await curlGet(`${base}/ok`)
    expect(result.status).toBe(200)
    expect(result.finalUrl).toBe(`${base}/ok`)
    expect(result.body).toContain('잠원 한강공원 테니스장')
  })

  it('404 상태코드를 그대로 반환한다', async () => {
    const result = await curlGet(`${base}/nope`)
    expect(result.status).toBe(404)
  })

  it('리다이렉트를 추적해 최종 URL과 최종 응답을 반환한다', async () => {
    const result = await curlGet(`${base}/redirect`)
    expect(result.status).toBe(200)
    expect(result.finalUrl).toBe(`${base}/login`)
    expect(result.body).toContain('login page')
  })
})
