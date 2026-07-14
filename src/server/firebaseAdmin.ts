import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "optimum-frame-b3kpg";
const databaseId = process.env.FIRESTORE_DATABASE_ID || "ai-studio-df84fe4d-6764-4f00-a58a-e280a3ccace6";

const adminApp = getApps()[0] || initializeApp({
  credential: applicationDefault(),
  projectId,
});

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp, databaseId);
