# 農業合同会社 Webサイト

人・技術・農業をつなぐプラットフォーム

## 📋 プロジェクトステータス

**現在**: 統合CMSアーキテクチャで稼働中、Firebase全面採用  
**公開サイト**: https://agricultural-llc.web.app  
**管理画面**: https://agricultural-llc.web.app/admin/

| 機能 | ステータス | 詳細 |
|------|-----------|------|
| 🌐 公開サイト | ✅ 稼働中 | Firebase Hosting |
| 📝 CMS管理画面 | ✅ 統合完了 | `/admin/` - SimpleMDE エディタ |
| 🗄️ データベース | ✅ 稼働中 | Firebase Realtime Database |
| 📁 ファイル管理 | ✅ 稼働中 | Firebase Storage |
| 🔐 認証システム | ✅ 稼働中 | Firebase Authentication |
| 🔄 CI/CD | ✅ 稼働中 | GitHub Actions → Firebase |

## 概要

農業合同会社の公式Webサイトです。農業DXの最前線から、持続可能な農業の未来を創造します。

## 主な機能

- 🌾 **会社情報** - 農業合同会社のビジョンとミッション
- 🤝 **つながる** - 農家・JA・行政との連携活動  
- 📚 **ブログ** - 農業DXに関する情報発信
- 📊 **事例紹介** - スマート農業の成功事例
- 📞 **お問い合わせ** - 無料相談フォーム
- 🔍 **キーワード検索** - サイト内コンテンツの全文検索

## アーキテクチャ

このプロジェクトは**統合CMSアーキテクチャ**を採用しています：

- **統合システム** (本リポジトリ): サイト配信 + CMS管理機能
- **Firebase連携**: Database + Storage + Auth の完全統合
- **リアルタイム更新**: 管理画面での編集が即座にサイトに反映
- **シンプル運用**: 単一リポジトリで完結する保守性

## 技術スタック

### Frontend
- **フレームワーク**: Astro v5.12.8
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: React
- **検索機能**: Fuse.js
- **開発言語**: TypeScript
- **エディタ**: SimpleMDE (Markdown)

### Backend & Infrastructure
- **ホスティング**: Firebase Hosting
- **データベース**: Firebase Realtime Database  
- **ファイルストレージ**: Firebase Storage
- **認証**: Firebase Authentication
- **CI/CD**: GitHub Actions
- **フォーム**: SSGform

### Content Management
- **CMS**: 統合管理画面 (`/admin/`)
- **エディタ**: SimpleMDE (streamlined single-pane view)
- **リンクカード**: `[linkcard:url]` 構文で自動プレビュー生成
- **画像管理**: Firebase Storage (drag & drop)
- **リアルタイム**: Firebase Database sync

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
│   ├── admin/     # CMS管理画面
│   ├── base/      # 基本レイアウト
│   ├── blog/      # ブログ関連
│   ├── common/    # 共通コンポーネント
│   ├── home/      # ホームページ専用
│   └── search/    # 検索機能
├── content/       # 静的コンテンツ（Markdown）
│   ├── about/     # 会社概要
│   └── home/      # トップページ
├── lib/           # ユーティリティ関数
│   ├── cms/       # CMS機能
│   ├── firebase/  # Firebase統合
│   └── firebaseLoader.ts  # データローダー
├── pages/         # ページルーティング
│   ├── admin/     # CMS管理画面
│   ├── api/       # APIエンドポイント
│   ├── index.astro    # トップページ
│   ├── about.astro    # 会社概要
│   ├── connect.astro  # つながる
│   ├── cases.astro    # 事例紹介
│   ├── contact.astro  # お問い合わせ
│   └── blog/          # ブログ（Firebase連携）
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
1. https://agricultural-llc.web.app/admin/ でログイン
2. 「ブログ記事」から「新規作成」または既存記事を編集
3. SimpleMDEエディターで記事を執筆（ライブプレビュー付き）
4. 画像はドラッグ&ドロップでFirebase Storageに自動アップロード
5. 「公開」または「下書き保存」で即座にサイトに反映

#### CMS機能
- **リアルタイム編集**: 保存と同時にサイトに反映
- **リンクカード**: `[linkcard:https://example.com]` でWebページのプレビューを自動生成
- **画像管理**: 自動最適化とCDN配信
- **カテゴリ・タグ**: 柔軟な分類システム
- **下書き機能**: 公開前の編集・確認
- **レスポンシブ**: モバイル対応のエディタ（簡素化されたシングルペイン表示）

### 事例の追加

`src/pages/cases.astro` のcases配列に新しい事例オブジェクトを追加してください。

### お問い合わせフォームの設定

`src/pages/contact.astro` のSSGformエンドポイントを適切に設定してください。

## パフォーマンス目標

- ページ読み込み時間: 0.5秒以内
- PageSpeed Insights: 95点以上
- SEO: 地域検索上位表示（3-6ヶ月以内）

## 最近のアップデート

### 2025年09月04日 - エディター改善とリンクカード機能追加
- ✅ **リンクカード機能実装** - `[linkcard:url]`構文でWebページプレビューを自動生成
- ✅ **エディター簡素化** - 2分割モードを廃止し、使いやすいシングルペイン表示に変更
- ✅ **TypeScriptエラー修正** - EntryHeader.astroコンポーネントのデータ構造エラーを解決
- ✅ **コードリファクタリング** - 不要なコード削除とドキュメント更新

### Firebase統合CMS完成（2025年09月04日）
- ✅ **統合CMSアーキテクチャ完了** - Firebase Database + Storage + Auth
- ✅ **SimpleMDEエディタ導入** - ライブプレビュー付きマークダウン編集
- ✅ **リアルタイム更新システム** - 編集内容が即座にサイトに反映
- ✅ **画像管理システム** - ドラッグ&ドロップでFirebase Storage連携
- ✅ **コードスニペット修正** - ライト/ダークモードの色コントラスト改善
- ✅ **ドキュメント整理完了** - 不要ファイル削除とREADME最新化

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