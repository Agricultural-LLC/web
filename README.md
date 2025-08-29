# 農業合同会社 Webサイトリニューアルプロジェクト

## プロジェクト概要

農業DXを推進する農業合同会社の新しいWebサイト開発プロジェクトです。  
「人と技術と農業をつなぐプラットフォーム」をビジョンに、SEO最適化された静的サイトを構築します。

## 技術スタック

- **フレームワーク**: Astro (Astrogonテンプレートベース)
- **スタイリング**: Tailwind CSS
- **ホスティング**: GitHub Pages / Vercel / Netlify（無料）
- **CDN/セキュリティ**: Cloudflare（将来的に）
- **コンテンツ管理**: Markdown + Astro Content Collections

## プロジェクト構造

```text
web/
├── public/           # 静的ファイル
├── src/
│   ├── assets/      # 画像・SVGファイル
│   ├── components/  # Astroコンポーネント
│   ├── content/     # コンテンツコレクション
│   │   ├── home/    # トップページ
│   │   ├── about/   # 会社概要
│   │   ├── blog/    # ブログ記事
│   │   ├── docs/    # ドキュメント
│   │   └── project/ # プロジェクト資料
│   ├── pages/       # ページルーティング
│   └── styles/      # スタイルシート
├── CLAUDE.md        # Claude Code用ガイドライン
└── README.md        # このファイル
```

## 開発開始

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# フォーマット
npm run format
```

## デプロイ方法

> ⚠️ **重要な注意事項**  
> 現在、このプロジェクトはGitHub Pages（`https://agricultural-llc.github.io/web/`）用に設定されています。  
> **Firebase HostingやVercelへの移行時は、`astro.config.mjs`のbaseパスを`"/"`に変更してください。**

### 1. GitHub Pages（現在使用中）

1. GitHubリポジトリのSettings > Pagesで「GitHub Actions」を選択
2. mainブランチにプッシュすると自動デプロイ
3. URL: `https://agricultural-llc.github.io/web/`

**移行前のチェックリスト:**
```javascript
// astro.config.mjs
// GitHub Pages用（現在の設定）
site: "https://agricultural-llc.github.io/web",
base: "/web/",

// Firebase Hosting/Vercel移行時は以下に変更
site: "https://your-domain.com",  
base: "/",
```

### 2. Vercel（推奨）

1. [Vercel](https://vercel.com)にGitHubアカウントでログイン
2. リポジトリをインポート
3. 自動デプロイ開始

### 3. Netlify

1. [Netlify](https://netlify.com)にGitHubアカウントでログイン
2. リポジトリをインポート
3. 自動デプロイ開始
```

## 主要機能

- **トップページ** - ビジョン・会社概要・活動ハイライト
- **つながるページ** - 農家・JA・行政との活動紹介
- **ブログ** - 農業DX情報発信（初心者向け、実践ノウハウ、成功事例、農業の未来）
- **事例紹介** - 地域別成功事例とギャラリー
- **お問い合わせ** - CAPTCHAつき問い合わせフォーム

## パフォーマンス目標

- ページ読み込み時間: 0.5秒以内
- PageSpeed Insights: 95点以上
- 3-6ヶ月以内での地域検索上位表示

## ドキュメント

プロジェクトの詳細な要件定義、技術仕様、スケジュールは`src/content/project/`ディレクトリ内のドキュメントを参照してください。

## テンプレートについて

このプロジェクトは[Astrogon](https://github.com/astrogon/astrogon)テンプレートをベースに構築されています。