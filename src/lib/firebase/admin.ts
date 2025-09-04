import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

let adminApp: any = null;

// Initialize Firebase Admin SDK
if (typeof window === "undefined") {
  try {
    // Check if app is already initialized
    adminApp = getApps().length > 0 ? getApp() : null;

    if (!adminApp) {
      // Initialize with service account
      const serviceAccount = require("../../../agricultural-llc-firebase-adminsdk-fbsvc-dab55169d3.json");

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: "https://agricultural-llc-default-rtdb.firebaseio.com",
      });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDatabase = adminApp ? getDatabase(adminApp) : null;

export { adminApp };
