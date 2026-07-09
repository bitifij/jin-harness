import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

export interface CurlResult {
  status: number
  finalUrl: string
  body: string
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

// 검증 HTTP는 fetch가 아니라 curl을 쓴다: gytennis 서버가 TLS 중간 인증서를 누락해
// Node/Bun fetch는 실패하지만 curl은 OS 키체인(AIA fetching)으로 성공한다 —
// 우리 쪽 접근 수단 때문에 멀쩡한 사이트를 broken으로 오판하지 않기 위함.
async function runCurl(args: string[]): Promise<CurlResult> {
  const dir = await mkdtemp(join(tmpdir(), 'verify-curl-'))
  const bodyFile = join(dir, 'body')
  try {
    const { stdout } = await execFileAsync('curl', [
      '-s',
      '-L',
      '--max-time',
      '30',
      '-A',
      UA,
      '-o',
      bodyFile,
      '-w',
      '%{http_code} %{url_effective}',
      ...args,
    ])
    const [status, finalUrl] = stdout.trim().split(' ')
    const body = await readFile(bodyFile, 'utf-8')
    return { status: Number(status), finalUrl, body }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export function curlGet(url: string): Promise<CurlResult> {
  return runCurl([url])
}

export function curlPost(url: string, form: Record<string, string>): Promise<CurlResult> {
  const dataArgs = Object.entries(form).flatMap(([k, v]) => ['--data-urlencode', `${k}=${v}`])
  return runCurl([...dataArgs, url])
}
