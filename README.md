# 農業合同会社 Webサイト

人・技術・農業をつなぐプラットフォーム

## 📋 プロジェクトステータス

**現在**: Decap CMS統合完了、Firebase Hostingで稼働中  
**管理画面**: https://agricultural-llc.web.app/admin/  
**URL**: https://agricultural-llc.web.app

| 機能 | ステータス | 詳細 |
|------|-----------|------|
| 🌐 本番サイト | ✅ 稼働中 | Firebase Hosting |
| 📝 CMS管理画面 | ✅ 稼働中 | Decap CMS (test-repoモード) |
| 🔄 CI/CD | ✅ 稼働中 | GitHub Actions |
| 📊 パフォーマンス | ✅ 最適化済み | ビルド時間1.89秒、31ページ生成 |

詳細は [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) を参照してください。

## 概要

農業合同会社の公式Webサイトです。農業DXの最前線から、持続可能な農業の未来を創造します。

## 主な機能

- 🌾 **会社情報** - 農業合同会社のビジョンとミッション
- 🤝 **つながる** - 農家・JA・行政との連携活動  
- 📚 **ブログ** - 農業DXに関する情報発信
- 📊 **事例紹介** - スマート農業の成功事例
- 📞 **お問い合わせ** - 無料相談フォーム
- 🔍 **キーワード検索** - サイト内コンテンツの全文検索
- ⚙️ **CMS管理画面** - Decap CMSによるコンテンツ管理

## 技術スタック

- **フレームワーク**: Astro v5.12.8
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: React
- **CMS**: Decap CMS (旧Netlify CMS)
- **検索機能**: Fuse.js, Pagefind
- **開発言語**: TypeScript
- **ホスティング**: Firebase Hosting
- **CI/CD**: GitHub Actions
- **フォーム**: SSGform
- **コンテンツ管理**: Editorial Workflow (プルリクエストベース)

## 開発環境のセットアップ

### 必要要件

- Node.js v20.15.0以上
- npm v10.9.0以上

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/Agricultural-LLC/web.git
cd web

# 依存関係のインストール
npm install
```

### 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev
```

http://localhost:4321/web/ でアクセス可能です。

### ビルドとプレビュー

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

### その他のコマンド

```bash
# コードフォーマット
npm run format

# 型チェック
npx tsc --noEmit
```

## プロジェクト構造

```
src/
├── assets/        # 画像・アセット
│   ├── agriculture/  # 農業関連画像
│   └── backgrounds/  # 背景画像
├── components/    # Astro/Reactコンポーネント
│   ├── base/      # 基本レイアウト
│   ├── blog/      # ブログ関連
│   ├── common/    # 共通コンポーネント
│   ├── home/      # ホームページ専用
│   └── search/    # 検索機能
├── content/       # コンテンツ（Markdown）
│   ├── about/     # 会社概要
│   ├── blog/      # ブログ記事
│   └── home/      # トップページ
├── lib/           # ユーティリティ関数
├── pages/         # ページルーティング
│   ├── index.astro    # トップページ
│   ├── about.astro    # 会社概要
│   ├── connect.astro  # つながる
│   ├── cases.astro    # 事例紹介
│   ├── contact.astro  # お問い合わせ
│   └── blog/          # ブログ
├── styles/        # グローバルスタイル
└── types/         # TypeScript型定義
```

## デプロイ

### Firebase Hosting（現在使用中）

GitHub Actionsを使用した自動デプロイが設定されています。
`main`ブランチへのプッシュで自動的にFirebase Hostingにデプロイされます。

**本番URL**: https://agricultural-llc.web.app

### 開発ブランチ戦略

- `main` - 本番環境（自動デプロイ対象）
- `dev` - 開発環境（レビュー用）
- `feature/*` - 機能開発用ブランチ

## カスタマイズガイド

### 会社情報の更新

`src/pages/about.astro` を編集してください。

### ブログ記事の追加

#### CMS管理画面を使用（推奨）
1. https://agricultural-llc.web.app/admin/ にアクセス
2. 「ブログ記事」セクションで新規作成
3. エディターで記事を執筆・プレビュー
4. 保存すると自動的にプルリクエストが作成
5. レビュー後にマージで本番反映

#### 直接編集（開発者向け）
1. `src/content/blog/` ディレクトリに新しいMarkdownファイルを作成
2. フロントマターに必要な情報を記載
3. 記事本文を執筆

### 事例の追加

`src/pages/cases.astro` のcases配列に新しい事例オブジェクトを追加してください。

### お問い合わせフォームの設定

`src/pages/contact.astro` のSSGformエンドポイントを適切に設定してください。

## パフォーマンス目標

- ページ読み込み時間: 0.5秒以内
- PageSpeed Insights: 95点以上
- SEO: 地域検索上位表示（3-6ヶ月以内）

## 最近のアップデート

### 2025年09月03日 - Decap CMS統合完了
- ✅ **Decap CMS実装完了** - ブラウザベースのコンテンツ管理
- ✅ **Editorial Workflow導入** - プルリクエストベースの承認フロー
- ✅ **管理画面稼働開始** - `/admin` でアクセス可能
- ✅ **TypeScriptエラー完全解消** - authorsコンポーネント削除
- ✅ **パフォーマンス最適化** - ビルド時間1.89秒達成
- ✅ **CI/CD統合** - GitHub ActionsとCMSの完全連携

## トラブルシューティング

### Vite最適化エラーの場合

```bash
rm -rf node_modules/.vite .astro
npm install
npm run dev
```

### TypeScriptエラーの確認

```bash
npx tsc --noEmit
```

## ライセンス

© 2024 農業合同会社 All rights reserved.

## お問い合わせ

- **代表社員**: 藤井 洋平
- **業務執行社員**: 新藤 洋介
- **所在地**: 〒060-0807 北海道札幌市北区北7条西4丁目1番地1
- **ウェブサイト**: https://agricultural-llc.web.app

---

🤖 このプロジェクトは[Claude Code](https://claude.ai/code)を使用して開発・保守されています。