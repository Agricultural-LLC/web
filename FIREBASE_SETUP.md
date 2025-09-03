# Firebase Hosting & CMS Setup Guide

このガイドでは、農業合同会社WebサイトをGitHub PagesからFirebase Hostingに移行し、CMSシステムをセットアップする手順を説明します。

## 🚀 概要

- **GitHub Pages** → **Firebase Hosting** への移行
- ブラウザベースCMS機能の追加
- GitHub API連携による記事管理
- TipTapエディタによるリッチテキスト編集
- 自動デプロイ機能

## 📋 必要な環境変数

以下の環境変数をGitHub Secretsに設定してください：

### Firebase設定
```
FIREBASE_PROJECT_ID=agricultural-llc
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@agricultural-llc.iam.gserviceaccount.com
FIREBASE_SERVICE_ACCOUNT_AGRICULTURAL_LLC=[Firebase Service Account JSON全体]
```

### GitHub API設定
```
GITHUB_PAT=github_pat_xxxxxxxxxxxx  # Personal Access Token (repo権限)
GITHUB_OWNER=Agricultural-LLC
GITHUB_REPO=web
```

### セキュリティ設定
```
API_KEY=your_secure_api_key_here      # 32文字以上のランダム文字列
JWT_SECRET=your_jwt_secret_here       # 32文字以上のランダム文字列
```

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

## 🖥️ 使用方法

### 管理画面アクセス

1. **本番環境**: https://agricultural-llc.web.app/admin
2. **ローカル**: http://localhost:4321/admin

### 初期ログイン情報

- **ユーザー名**: `admin`
- **パスワード**: `admin123`

⚠️ **重要**: 本番環境では必ずパスワードを変更してください。

### 記事管理フロー

1. `/admin/login` - ログイン
2. `/admin` - ダッシュボード（記事一覧）
3. `/admin/posts/new` - 新規記事作成
4. `/admin/posts/edit/[slug]` - 記事編集
5. 保存 → GitHub Repository更新 → 自動デプロイ

## 🔄 デプロイフロー

1. **記事作成/編集** - 管理画面から操作
2. **GitHub更新** - API経由でリポジトリ更新
3. **自動ビルド** - GitHub Actions実行
4. **Firebase Deploy** - 本番サイト更新

## 📱 機能一覧

### CMS機能
- ✅ 記事作成・編集・削除
- ✅ リッチテキストエディタ（TipTap）
- ✅ 画像アップロード
- ✅ 下書き機能
- ✅ メタデータ管理（タグ、カテゴリ等）

### システム機能
- ✅ 認証システム
- ✅ API endpoints
- ✅ GitHub連携
- ✅ Firebase Hosting
- ✅ 自動デプロイ

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