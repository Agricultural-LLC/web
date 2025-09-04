import { auth } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

export interface CMSUser {
  uid: string;
  email: string;
  displayName?: string;
}

export class AuthService {
  private user: CMSUser | null = null;
  private listeners: ((user: CMSUser | null) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          this.user = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || undefined,
          };
        } else {
          this.user = null;
        }

        this.notifyListeners();
      });
    }
  }

  async signIn(email: string, password: string): Promise<CMSUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      const user = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
      };

      this.user = user;
      this.notifyListeners();

      return user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signOut(): Promise<void> {
    await signOut(auth);
    this.user = null;
    this.notifyListeners();
  }

  getCurrentUser(): CMSUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  onAuthStateChange(callback: (user: CMSUser | null) => void): () => void {
    this.listeners.push(callback);

    // Immediately call with current state
    callback(this.user);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.user));
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case "auth/user-not-found":
        return "ユーザーが見つかりません";
      case "auth/wrong-password":
        return "パスワードが間違っています";
      case "auth/invalid-email":
        return "メールアドレスの形式が正しくありません";
      case "auth/user-disabled":
        return "このアカウントは無効になっています";
      case "auth/too-many-requests":
        return "ログイン試行回数が多すぎます。しばらく待ってからお試しください";
      default:
        return "ログインに失敗しました";
    }
  }
}

export const authService = new AuthService();
