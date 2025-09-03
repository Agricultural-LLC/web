# 📋 CMS MVP実装計画書

## 🎯 目標
最小限の労力で、ブラウザから記事を作成できる機能を実装する

## 🏗️ アーキテクチャ（超シンプル版）

```
Simple HTML Form → Firebase Function → GitHub API → Auto Deploy
```

## 📁 必要なファイル（最小構成）

### 1. Firebase Functions初期化
```bash
firebase init functions
cd functions
npm install @octokit/rest
```

### 2. 記事作成Function（functions/index.js）
```javascript
const functions = require('firebase-functions');
const { Octokit } = require('@octokit/rest');

exports.createPost = functions.https.onCall(async (data, context) => {
  // 簡単な認証チェック
  if (data.password !== process.env.ADMIN_PASSWORD) {
    throw new functions.https.HttpsError('unauthenticated', 'Invalid password');
  }

  const octokit = new Octokit({
    auth: process.env.GH_PAT,
  });

  const { title, content, slug } = data;
  
  // Markdownファイル作成
  const markdown = `---
title: "${title}"
description: ""
date: ${new Date().toISOString().split('T')[0]}
draft: false
---

${content}`;

  // GitHubにコミット
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: process.env.GH_OWNER,
    repo: process.env.GH_REPO,
    path: `src/content/blog/${slug}.md`,
    message: `feat: 新規記事「${title}」を追加`,
    content: Buffer.from(markdown).toString('base64'),
    branch: 'main'
  });

  return { success: true, slug };
});
```

### 3. シンプルな管理画面（src/pages/admin/simple-new.html）
```html
<!DOCTYPE html>
<html>
<head>
  <title>記事作成 - 農業合同会社CMS</title>
  <style>
    body { 
      font-family: sans-serif; 
      max-width: 800px; 
      margin: 50px auto; 
      padding: 20px;
    }
    input, textarea { 
      width: 100%; 
      margin: 10px 0; 
      padding: 10px;
      border: 1px solid #ddd;
    }
    button { 
      background: #4CAF50; 
      color: white; 
      padding: 10px 20px; 
      border: none;
      cursor: pointer;
    }
    button:hover { background: #45a049; }
    .message { 
      padding: 10px; 
      margin: 10px 0; 
      border-radius: 5px;
    }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>新規記事作成</h1>
  
  <div id="message"></div>
  
  <form id="postForm">
    <input type="password" id="password" placeholder="管理者パスワード" required>
    <input type="text" id="title" placeholder="記事タイトル" required>
    <input type="text" id="slug" placeholder="URLスラッグ（英数字とハイフン）" required pattern="[a-z0-9-]+">
    <textarea id="content" placeholder="記事本文（Markdown形式）" rows="20" required></textarea>
    <button type="submit">記事を作成</button>
  </form>

  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

    const firebaseConfig = {
      projectId: "agricultural-llc",
      // 他の設定値は公開情報なので問題なし
    };

    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);

    document.getElementById('postForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messageDiv = document.getElementById('message');
      messageDiv.innerHTML = '<div class="message">送信中...</div>';
      
      const createPost = httpsCallable(functions, 'createPost');
      
      try {
        const result = await createPost({
          password: document.getElementById('password').value,
          title: document.getElementById('title').value,
          slug: document.getElementById('slug').value,
          content: document.getElementById('content').value
        });
        
        messageDiv.innerHTML = '<div class="message success">記事を作成しました！2-3分後にサイトに反映されます。</div>';
        document.getElementById('postForm').reset();
        
      } catch (error) {
        messageDiv.innerHTML = `<div class="message error">エラー: ${error.message}</div>`;
      }
    });
  </script>
</body>
</html>
```

## 🚀 実装手順（30分で完了）

### Step 1: Firebase Functions設定（10分）
```bash
# Functionsを初期化
firebase init functions
# JavaScript選択、ESLint無効、依存関係インストール

# 必要なパッケージ追加
cd functions
npm install @octokit/rest
```

### Step 2: 環境変数設定（5分）
```bash
# Functions用の環境変数設定
firebase functions:config:set \
  github.pat="YOUR_PAT" \
  github.owner="Agricultural-LLC" \
  github.repo="web" \
  admin.password="YOUR_SECURE_PASSWORD"
```

### Step 3: デプロイ（10分）
```bash
# Functionsをデプロイ
firebase deploy --only functions

# 管理画面HTMLを追加してコミット
git add src/pages/admin/simple-new.html
git commit -m "feat: 最小限のCMS機能を追加"
git push origin main
```

### Step 4: テスト（5分）
```
1. https://agricultural-llc.web.app/admin/simple-new.html にアクセス
2. パスワードを入力
3. 記事を作成
4. 2-3分待つ
5. ブログに反映を確認
```

## 📊 このMVPの利点

1. **即座に実装可能**：30分で完了
2. **最小限のコード**：100行未満
3. **動作確認可能**：すぐにテスト可能
4. **拡張可能**：後から機能追加が容易

## 🎯 成功基準

- [ ] ブラウザから記事を作成できる
- [ ] GitHubに自動コミットされる
- [ ] サイトに自動反映される
- [ ] エラーハンドリングが機能する

## 📈 次のステップ

MVPが動作したら：
1. 編集機能を追加
2. 記事一覧を追加
3. リッチエディタに置き換え
4. 認証を強化

---

**これなら今すぐ始められます！**
