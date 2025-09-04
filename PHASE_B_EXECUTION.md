# 📋 Phase B 実施手順書（最終版）

## 🕐 2025年9月4日（水）実施スケジュール

### 10:00-10:05 キックオフ
- [ ] チーム全員参加確認
- [ ] 本日の目標共有
- [ ] 役割分担確認

### 10:05-10:15 バックアップ作成

```bash
# 実行者：リーダー
git checkout main
git pull origin main
git checkout -b backup-20250904
git push origin backup-20250904
```

### 10:15-10:20 config.yml更新

**ファイル**: `public/admin/config.yml`

```yaml
# 変更前（現在）
backend:
  name: test-repo

# 変更後（本番）
backend:
  name: github
  repo: Agricultural-LLC/web
  branch: main
```

### 10:20-10:25 コミット&デプロイ

```bash
git add public/admin/config.yml
git commit -m "feat: Decap CMS本番モード有効化 - GitHub認証開始"
git push origin main
```

### 10:25-10:35 動作確認

#### チェックリスト

- [ ] Firebase Hosting反映確認（2-3分待機）
- [ ] https://agricultural-llc.web.app/admin/ アクセス
- [ ] 「Login with GitHub」ボタン表示
- [ ] GitHub認証フロー確認
- [ ] リポジトリアクセス許可

### 10:35-10:45 機能テスト

#### テスト記事作成

```markdown
タイトル: CMS本番稼働開始のお知らせ
内容: 
本日より、農業合同会社WebサイトのCMSシステムが
本番稼働を開始しました。
ブラウザから直接記事の編集が可能になります。
```

- [ ] 記事作成
- [ ] プレビュー確認
- [ ] 下書き保存（ブランチ作成確認）
- [ ] PR作成確認

### 10:45-10:50 チーム全員アクセステスト

**各メンバー実施項目：**
1. 管理画面にアクセス
2. GitHub認証
3. 記事一覧表示確認
4. 結果報告

### 10:50-11:00 完了確認&ドキュメント化

- [ ] 全機能正常動作確認
- [ ] 問題点リスト作成（あれば）
- [ ] 運用開始宣言

---

## ⚠️ トラブルシューティング

### よくある問題と解決方法

| 問題 | 原因 | 対処 |
|------|------|------|
| ログインボタンなし | キャッシュ | Ctrl+F5で強制更新 |
| 404エラー | パス問題 | /admin/でアクセス |
| 権限エラー | GitHub権限不足 | repo権限確認 |

### 緊急ロールバック（問題発生時のみ）

```bash
# 即座にtest-repoモードに戻す
git checkout main
git pull origin main

# config.yml修正
sed -i '' 's/name: github/name: test-repo/' public/admin/config.yml
sed -i '' '/repo: Agricultural-LLC/d' public/admin/config.yml
sed -i '' '/branch: main/d' public/admin/config.yml

git add public/admin/config.yml
git commit -m "fix: 一時的にtest-repoモードに復帰"
git push origin main
```

---

## ✅ 成功基準

### 必須達成項目
- [ ] GitHub認証成功
- [ ] 記事作成可能
- [ ] Editorial Workflow動作
- [ ] チーム全員アクセス可能
- [ ] エラーログなし

### Phase B完了条件
すべての必須項目が✓になること

---

## 📞 エスカレーション

問題発生時：
1. このチャットで即座に報告
2. エラーメッセージを共有
3. 対処方法を協議

---

**10:00に全員集合してください**
