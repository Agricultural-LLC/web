import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain:
    import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "agricultural-llc.firebaseapp.com",
  databaseURL:
    import.meta.env.PUBLIC_FIREBASE_DATABASE_URL ||
    "https://agricultural-llc-default-rtdb.firebaseio.com",
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "agricultural-llc",
  storageBucket:
    import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "agricultural-llc.appspot.com",
  messagingSenderId:
    import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId:
    import.meta.env.PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123def456",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

// Enable offline persistence for database
if (typeof window !== "undefined") {
  // Configure auth to use local storage
  auth.useDeviceLanguage();
}

export default app;
