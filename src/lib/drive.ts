import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scope for managing files created by this app
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory cache for access token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ── GOOGLE DRIVE SYNC LOGIC ──

export interface BackupData {
  notes: any[];
  tasks: any[];
  finance: any[];
  syncedAt: string;
  backupName: string;
}

/**
 * Searches Google Drive for the file 'SmartJournal_Backup.json'
 */
export async function findBackupFile(accessToken: string): Promise<string | null> {
  try {
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      "name='SmartJournal_Backup.json' and trashed=false"
    )}&spaces=drive`;

    const res = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to list backup files: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding backup file:', error);
    throw error;
  }
}

/**
 * Downloads backup data from Google Drive
 */
export async function downloadBackup(accessToken: string, fileId: string): Promise<BackupData | null> {
  try {
    const getUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download file: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
}

/**
 * Creates/Uploads a new backup file to Google Drive or updates an existing one
 */
export async function uploadBackup(
  accessToken: string,
  backupData: BackupData,
  existingFileId?: string | null
): Promise<string> {
  try {
    const metadata = {
      name: 'SmartJournal_Backup.json',
      mimeType: 'application/json',
    };
    const fileContent = JSON.stringify(backupData, null, 2);

    if (existingFileId) {
      // Perform an update (PATCH URL with media upload type)
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
      const res = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });

      if (!res.ok) {
        throw new Error(`Failed to update backup file: ${res.statusText}`);
      }

      const file = await res.json();
      return file.id || existingFileId;
    } else {
      // Perform a multipart creation (POST)
      const boundary = 'smart_journal_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelim;

      const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const res = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!res.ok) {
        throw new Error(`Failed to upload backup file: ${res.statusText}`);
      }

      const file = await res.json();
      return file.id;
    }
  } catch (error) {
    console.error('Error uploading backup:', error);
    throw error;
  }
}
