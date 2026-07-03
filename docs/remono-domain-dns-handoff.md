# remono DNS / Firebase Hosting handoff

作成日: 2026-07-03

Firebase Hosting site `agricultural-llc` に以下の custom domain を登録済みです。

- `remono.co.jp`: `agricultural-llc` を直接配信
- `www.remono.co.jp`: `remono.co.jp` へ 301 リダイレクト
- `remono.ai`: `remono.co.jp` へ 301 リダイレクト
- `www.remono.ai`: `remono.co.jp` へ 301 リダイレクト

現時点の nameserver は `remono.co.jp` / `remono.ai` とも GoDaddy
(`domaincontrol.com`) です。Firebase 側は `HOST_MISMATCH` /
`OWNERSHIP_MISSING` / `CERT_VALIDATING` のため、GoDaddy DNS の変更が必要です。

## GoDaddy DNS changes

### remono.co.jp

Remove:

- `A remono.co.jp 15.197.148.33`
- `A remono.co.jp 3.33.130.190`

Add:

- `A remono.co.jp 199.36.158.100`
- `TXT remono.co.jp hosting-site=agricultural-llc`

### www.remono.co.jp

Remove:

- `CNAME www.remono.co.jp remono.co.jp`

Add:

- `CNAME www.remono.co.jp agricultural-llc.web.app`

### remono.ai

Remove:

- `A remono.ai 13.248.243.5`
- `A remono.ai 76.223.105.230`

Add:

- `A remono.ai 199.36.158.100`
- `TXT remono.ai hosting-site=agricultural-llc`

Keep existing:

- `TXT remono.ai google-site-verification=Ucl6AeyJ28GxWvoJt_9QXyI22uu34q7Ewl7sUJykM6A`
- `TXT remono.ai v=spf1 include:_spf.google.com ~all`

### www.remono.ai

Remove:

- `CNAME www.remono.ai remono.ai`

Add:

- `CNAME www.remono.ai agricultural-llc.web.app`

## After DNS changes

Wait for Firebase Hosting to show `HOST_ACTIVE`, `OWNERSHIP_ACTIVE`, and
`CERT_ACTIVE`, then verify:

```bash
curl -I https://remono.co.jp/
curl -I https://www.remono.co.jp/
curl -I https://remono.ai/
curl -I https://www.remono.ai/
curl -I https://nogyodata.com/
```

Expected final state:

- `https://remono.co.jp/` returns `200` and serves the remono site.
- `https://www.remono.co.jp/` redirects to `https://remono.co.jp/`.
- `https://remono.ai/` redirects to `https://remono.co.jp/`.
- `https://www.remono.ai/` redirects to `https://remono.co.jp/`.
- `https://nogyodata.com/` remains on the current Firebase Hosting site and is not redirected.
