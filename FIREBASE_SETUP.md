# Firebase Hosting移行完了 & CMSシステム設定ガイド

このガイドでは、農業合同会社WebサイトのFirebase Hosting移行状況と、今後のCMSシステム実装について説明します。

## 🚀 現在のステータス

### ✅ 実装済み機能
- **Firebase Hosting**（静的サイト）✅ 完了
- **GitHub Actions**自動デプロイ ✅ 完了  
- **31ページ**の静的コンテンツ ✅ 完了

### ❌ 未実装機能（CMSシステム）
- **ブラウザベースのエディタ** ❌ 静的ビルド制約により削除
- **管理画面**（/admin/*） ❌ 削除済み
- **APIエンドポイント** ❌ 削除済み
- **リアルタイム記事更新** ❌ 未実装

**⚠️ 重要**: CMSシステムは静的ビルドの制約により、現在実装されていません。
Firebase Functionsを使用した実装を検討中です。

## 📋 環境変数の状況

### ✅ 現在使用中（Firebase Hosting用）
```
FIREBASE_PROJECT_ID=agricultural-llc
FIREBASE_SERVICE_ACCOUNT_AGRICULTURAL_LLC=[Firebase Service Account JSON]
```

### ⏸️ 設定済み（CMS実装時に使用予定）
以下の環境変数はGitHub Secretsに設定済みですが、現在は未使用です：

```bash
# GitHub API連携用（CMSシステム実装時に使用）
GH_PAT=github_pat_xxxxxxxxxxxx
GH_OWNER=Agricultural-LLC  
GH_REPO=web

# API認証用（CMSシステム実装時に使用）
API_KEY=[32文字のランダム文字列]
JWT_SECRET=[32文字のランダム文字列]
```

**注意**: 現在の静的サイトではこれらの環境変数は使用されていません。

## 🔧 セットアップ手順

### 1. Firebase Serviceアカウント取得

既にローカルに存在する `agricultural-llc-firebase-adminsdk-fbsvc-dab55169d3.json` ファイルの内容を使用します。

### 2. GitHub Personal Access Token作成

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 以下の権限を付与：
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)

### 3. GitHub Secretsの設定

リポジトリの Settings → Secrets and variables → Actions で以下を追加：

```bash
# Firebase関連
FIREBASE_PROJECT_ID: agricultural-llc
FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL: firebase-adminsdk-fbsvc@agricultural-llc.iam.gserviceaccount.com
FIREBASE_SERVICE_ACCOUNT_AGRICULTURAL_LLC: {JSON全体}

# GitHub関連  
GITHUB_PAT: github_pat_xxxxxxxxxxxx
GITHUB_OWNER: Agricultural-LLC
GITHUB_REPO: web

# セキュリティ
API_KEY: [32文字のランダム文字列]
JWT_SECRET: [32文字のランダム文字列]
```

### 4. ローカル開発環境

`.env.local` ファイルを作成：

```env
FIREBASE_PROJECT_ID=agricultural-llc
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@agricultural-llc.iam.gserviceaccount.com

GITHUB_PAT=your_github_pat_here
GITHUB_OWNER=Agricultural-LLC
GITHUB_REPO=web
GITHUB_BRANCH=main

API_KEY=your_local_api_key
JWT_SECRET=your_local_jwt_secret

PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_API_URL=http://localhost:4321/api
```

## 🖥️ 現在の使用方法

### ❌ 管理画面（利用不可）

~~管理画面は現在削除されています~~:
- ~~https://agricultural-llc.web.app/admin~~ （404エラー）
- 静的ビルド制約により機能停止

### ✅ 現在の記事管理フロー（Git直接編集）

1. **ローカルで編集**
   ```bash
   # ブログ記事を編集
   code src/content/blog/記事名.md
   ```

2. **コミット&プッシュ**
   ```bash
   git add .
   git commit -m "content: 記事を更新"
   git push origin main
   ```

3. **自動デプロイ**
   - GitHub Actionsが自動実行
   - 約2-3分でFirebase Hostingに反映

### ⏳ 今後実装予定（CMSシステム）

Firebase Functions実装後に以下が利用可能になります：
- ブラウザベース記事編集
- 管理画面ダッシュボード
- リアルタイムプレビュー
- 画像アップロード機能

## 🔄 デプロイフロー

1. **記事作成/編集** - 管理画面から操作
2. **GitHub更新** - API経由でリポジトリ更新
3. **自動ビルド** - GitHub Actions実行
4. **Firebase Deploy** - 本番サイト更新

## 📱 機能一覧

### ✅ 現在利用可能な機能
- ✅ **Firebase Hosting** - 静的サイトホスティング
- ✅ **自動デプロイ** - GitHub Actions CI/CD
- ✅ **静的サイト生成** - 31ページの高速表示
- ✅ **SEO最適化** - メタタグ、構造化データ
- ✅ **レスポンシブデザイン** - モバイル対応

### ❌ 現在利用不可（今後実装予定）
- ❌ **管理画面** - ブラウザベース編集画面
- ❌ **リッチテキストエディタ** - TipTapエディタ
- ❌ **画像アップロード** - ドラッグ&ドロップ
- ❌ **下書き機能** - プレビュー機能
- ❌ **認証システム** - ログイン・権限管理
- ❌ **APIエンドポイント** - CRUD操作
- ❌ **GitHub連携** - 自動コミット機能

## 🛡️ セキュリティ

- JWT tokenによる認証
- HTTP-only cookieセッション
- API キー認証
- CORS設定
- 入力値検証

## 🚨 トラブルシューティング

### ビルドエラー

```bash
npm run build
```

### 依存関係の問題

```bash
rm -rf node_modules package-lock.json
npm install
```

### 型エラー

```bash
npx tsc --noEmit
```

### Firebase認証エラー

1. Service Account JSONの確認
2. 環境変数の設定確認
3. Firebaseプロジェクト設定確認

## 📞 サポート

技術的な問題やセットアップについて質問がある場合は、開発チームにお問い合わせください。

---

🤖 この設定はClaude Codeで自動生成されました。