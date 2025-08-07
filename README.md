# 農業合同会社 Webサイトリニューアルプロジェクト

## プロジェクト概要

農業DXを推進する農業合同会社の新しいWebサイト開発プロジェクトです。  
「人と技術と農業をつなぐプラットフォーム」をビジョンに、SEO最適化された静的サイトを構築します。

## 技術スタック

- **フレームワーク**: Astro (静的サイトジェネレーター)
- **ホスティング**: Firebase Hosting
- **CDN/セキュリティ**: Cloudflare
- **コンテンツ管理**: Markdown + Astro Content Collections

## プロジェクト構造

```text
web/
├── docs/           # プロジェクトドキュメント
│   ├── PDF/       # PDF版ドキュメント
│   └── markdown/  # Markdown版ドキュメント
├── logo.png       # 会社ロゴ
├── CLAUDE.md      # Claude Code用ガイドライン
└── README.md      # このファイル
```

## 開発開始

```bash
# Astroプロジェクトの初期化
npm create astro@latest .

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build
```

## 主要機能

- トップページ（ビジョン・会社概要）
- つながるページ（活動紹介）
- ブログ（農業DX情報発信）
- 事例紹介
- お問い合わせ

## パフォーマンス目標

- ページ読み込み時間: 0.5秒以内
- PageSpeed Insights: 95点以上
- 3-6ヶ月以内での地域検索上位表示

## ドキュメント

詳細な要件定義、技術仕様、スケジュールは`docs/`ディレクトリ内のドキュメントを参照してください。
