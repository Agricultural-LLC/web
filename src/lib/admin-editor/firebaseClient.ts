import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { FirebaseWebConfig } from "./types";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  database: Database;
  storage: FirebaseStorage;
}

export function initFirebase(config: FirebaseWebConfig): FirebaseServices {
  if (!config || !config.apiKey) {
    document.body.innerHTML =
      '<div style="padding: 2rem; text-align: center; color: red;">Firebase設定エラー: 環境変数が正しく読み込まれませんでした</div>';
    throw new Error("Firebase config not loaded");
  }

  const app = initializeApp(config);
  return {
    app,
    auth: getAuth(app),
    database: getDatabase(app, config.databaseURL),
    storage: getStorage(app),
  };
}
