
/**
 * FIREBASE CLOUD FUNCTIONS (Concept/Implementation)
 * 
 * To deploy: firebase deploy --only functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Initialize Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * startDriveImport
 * Callable function for Admin to trigger video copy from Google Drive to Firebase Storage
 */
export const startDriveImport = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes max
    memory: '1GB'
  })
  .https.onCall(async (data, context) => {
    // 1. Auth & Admin Check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    
    const { videoId, driveFileId, driveAccessToken } = data;
    if (!videoId || !driveFileId || !driveAccessToken) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters.');
    }

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    // 2. Create Import Job
    const jobId = uuidv4();
    const jobRef = db.collection('importJobs').doc(jobId);
    
    await jobRef.set({
      videoId,
      driveFileId,
      status: 'queued',
      progress: 0,
      bytesTransferred: 0,
      totalBytes: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid
    });

    try {
      // 3. Get Metadata from Drive
      const metaResponse = await axios.get(`https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=name,size,mimeType`, {
        headers: { Authorization: `Bearer ${driveAccessToken}` }
      });
      
      const { name, size, mimeType } = metaResponse.data;
      const totalBytes = parseInt(size);
      const extension = name.split('.').pop() || 'mp4';
      const destinationPath = `videos/${videoId}/source/${driveFileId}.${extension}`;

      await jobRef.update({
        status: 'running',
        totalBytes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Start Streaming Import
      const driveStream = await axios({
        method: 'get',
        url: `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
        headers: { Authorization: `Bearer ${driveAccessToken}` },
        responseType: 'stream'
      });

      const file = bucket.file(destinationPath);
      const writeStream = file.createWriteStream({
        metadata: { contentType: mimeType },
        resumable: false
      });

      let bytesTransferred = 0;
      let lastUpdateAt = Date.now();

      return new Promise((resolve, reject) => {
        driveStream.data.on('data', (chunk: any) => {
          bytesTransferred += chunk.length;
          
          // Throttled Firestore updates (every 2 seconds or 5% progress)
          const now = Date.now();
          const progress = Math.round((bytesTransferred / totalBytes) * 100);
          
          if (now - lastUpdateAt > 2000) {
            jobRef.update({
              progress,
              bytesTransferred,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }).catch(console.error);
            lastUpdateAt = now;
          }
        });

        driveStream.data.pipe(writeStream)
          .on('finish', async () => {
            // 5. Success - Update Video & Job
            const importedAt = Date.now();
            await admin.firestore().collection('videos').doc(videoId).update({
              storagePath: destinationPath,
              sourceType: 'google_drive',
              sourceMeta: {
                driveFileId,
                driveFileName: name,
                mimeType,
                sizeBytes: totalBytes,
                importedAt
              },
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            await jobRef.update({
              status: 'done',
              progress: 100,
              bytesTransferred: totalBytes,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            resolve({ jobId, success: true });
          })
          .on('error', async (err: Error) => {
            await jobRef.update({
              status: 'error',
              errorMessage: err.message,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            reject(err);
          });
      });

    } catch (error: any) {
      await jobRef.update({
        status: 'error',
        errorMessage: error.message || 'Unknown error during import initialization',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      throw new functions.https.HttpsError('internal', error.message || 'Import failed');
    }
  });
