// FCM Service - Firebase Cloud Messaging Integration
const admin = require('firebase-admin');
const Notification = require('../models/notification-model');
const FCMToken = require('../models/fcm-token-model');
const User = require('../models/user-model');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length === 0) {
      // Initialize with service account key from environment variable or file
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // If service account key is provided as JSON string in env
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // If path to service account file is provided
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        console.warn('Firebase Admin SDK not initialized. FCM notifications will not work.');
        console.warn('Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH environment variable.');
        return;
      }
    }
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    firebaseInitialized = false;
  }
}

// Initialize on module load
initializeFirebase();

/**
 * Send notification to a single user
 * @param {String} userId - User ID
 * @param {String|Object} title - Notification title (string or {en: string, ar: string})
 * @param {String|Object} message - Notification message (string or {en: string, ar: string})
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} Result object with success status
 */
async function sendNotification(userId, title, message, data = {}) {
  let tokenDoc = null;
  try {
    // 1. Get user's language preference and FCM token
    const user = await User.findById(userId).select('language');
    const userLanguage = (user && user.language) || 'en';
    
    // Normalize title and message to bilingual format
    const bilingualTitle = typeof title === 'string' 
      ? { en: title, ar: title } 
      : (title.en && title.ar ? title : { en: title.en || title, ar: title.ar || title.en || title });
    
    const bilingualMessage = typeof message === 'string'
      ? { en: message, ar: message }
      : (message.en && message.ar ? message : { en: message.en || message, ar: message.ar || message.en || message });

    // 2. Get user's FCM token from database
    tokenDoc = await FCMToken.findOne({ userId });
    if (!tokenDoc || !tokenDoc.token) {
      console.log(`No FCM token found for user ${userId}`);
      // Still create notification in database even if no token
      const notification = await Notification.create({
        userId,
        title: bilingualTitle,
        message: bilingualMessage,
        read: false,
        data,
        createdAt: new Date()
      });
      return { 
        success: false, 
        message: 'No FCM token found',
        notificationId: notification._id
      };
    }

    // 3. Create notification in database with bilingual content
    const notification = await Notification.create({
      userId,
      title: bilingualTitle,
      message: bilingualMessage,
      read: false,
      data,
      createdAt: new Date()
    });

    // 4. Send via FCM (only if Firebase is initialized)
    if (!firebaseInitialized || admin.apps.length === 0) {
      console.warn('Firebase Admin SDK not initialized. Notification saved to database but not sent via FCM.');
      return {
        success: true,
        notificationId: notification._id,
        message: 'Notification saved but FCM not configured'
      };
    }

    // Use user's preferred language for FCM push notification
    const fcmTitle = bilingualTitle[userLanguage] || bilingualTitle.en;
    const fcmBody = bilingualMessage[userLanguage] || bilingualMessage.en;

    const fcmMessage = {
      notification: {
        title: fcmTitle,
        body: fcmBody
      },
      data: {
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
        notificationId: notification._id.toString(),
        createdAt: notification.createdAt.toISOString()
      },
      token: tokenDoc.token
    };

    const response = await admin.messaging().send(fcmMessage);
    console.log('Successfully sent FCM message:', response);

    return {
      success: true,
      notificationId: notification._id,
      fcmMessageId: response
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If FCM fails, still save notification in database if not already saved
    try {
      const notification = await Notification.findOne({ 
        userId, 
        title, 
        message,
        createdAt: { $gte: new Date(Date.now() - 60000) } // Created in last minute
      });
      
      if (!notification) {
        // Normalize title and message to bilingual format
        const bilingualTitle = typeof title === 'string' 
          ? { en: title, ar: title } 
          : (title.en && title.ar ? title : { en: title.en || title, ar: title.ar || title.en || title });
        
        const bilingualMessage = typeof message === 'string'
          ? { en: message, ar: message }
          : (message.en && message.ar ? message : { en: message.en || message, ar: message.ar || message.en || message });
        
        await Notification.create({
          userId,
          title: bilingualTitle,
          message: bilingualMessage,
          read: false,
          data,
          createdAt: new Date()
        });
      }
    } catch (dbError) {
      console.error('Error saving notification to database:', dbError);
    }
    
    // Handle invalid token errors
    if ((error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') &&
        tokenDoc && tokenDoc.token) {
      // Remove invalid token
      try {
        await FCMToken.deleteOne({ userId, token: tokenDoc.token });
        console.log(`Removed invalid FCM token for user ${userId}`);
      } catch (deleteError) {
        console.error('Error removing invalid token:', deleteError);
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'unknown_error'
    };
  }
}

/**
 * Send notifications to multiple users
 * @param {Array<String>} userIds - Array of user IDs
 * @param {String|Object} title - Notification title (string or {en: string, ar: string})
 * @param {String|Object} message - Notification message (string or {en: string, ar: string})
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} Result object with success count
 */
async function sendBulkNotifications(userIds, title, message, data = {}) {
  try {
    // 1. Normalize title and message to bilingual format
    const bilingualTitle = typeof title === 'string' 
      ? { en: title, ar: title } 
      : (title.en && title.ar ? title : { en: title.en || title, ar: title.ar || title.en || title });
    
    const bilingualMessage = typeof message === 'string'
      ? { en: message, ar: message }
      : (message.en && message.ar ? message : { en: message.en || message, ar: message.ar || message.en || message });

    // 2. Get users and their FCM tokens
    const users = await User.find({ _id: { $in: userIds } }).select('language');
    const tokens = await FCMToken.find({ userId: { $in: userIds } });
    
    const userLanguageMap = {};
    users.forEach(user => {
      userLanguageMap[user._id.toString()] = user.language || 'en';
    });
    
    const validTokens = tokens.map(t => t.token);
    const usersWithTokens = tokens.map(t => t.userId.toString());
    
    // 3. Create notifications in database for all users
    const notifications = await Notification.insertMany(
      userIds.map(userId => ({
        userId,
        title: bilingualTitle,
        message: bilingualMessage,
        read: false,
        data,
        createdAt: new Date()
      }))
    );

    // 4. Send via FCM multicast (only if Firebase is initialized and we have tokens)
    if (!firebaseInitialized || admin.apps.length === 0) {
      console.warn('Firebase Admin SDK not initialized. Notifications saved to database but not sent via FCM.');
      return { 
        success: true, 
        successCount: 0,
        totalCount: notifications.length,
        message: 'Notifications saved but FCM not configured'
      };
    }

    if (validTokens.length === 0) {
      return {
        success: true,
        successCount: 0,
        totalCount: notifications.length,
        message: 'No FCM tokens found for users'
      };
    }

    // For bulk notifications, we'll use English as default (FCM multicast doesn't support per-user language)
    // Individual notifications will be sent with user's preferred language
    const fcmMessage = {
      notification: {
        title: bilingualTitle.en,
        body: bilingualMessage.en
      },
      data: {
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
        titleEn: bilingualTitle.en,
        titleAr: bilingualTitle.ar,
        messageEn: bilingualMessage.en,
        messageAr: bilingualMessage.ar
      },
      tokens: validTokens
    };

    const response = await admin.messaging().sendEachForMulticast(fcmMessage);
    
    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: validTokens[idx],
            error: resp.error
          });
        }
      });

      // Remove invalid tokens
      for (const failed of failedTokens) {
        if (failed.error.code === 'messaging/invalid-registration-token' ||
            failed.error.code === 'messaging/registration-token-not-registered') {
          try {
            await FCMToken.deleteOne({ token: failed.token });
            console.log(`Removed invalid FCM token: ${failed.token.substring(0, 20)}...`);
          } catch (deleteError) {
            console.error('Error removing invalid token:', deleteError);
          }
        }
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalCount: notifications.length
    };
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return {
      success: false,
      error: error.message,
      totalCount: userIds.length
    };
  }
}

module.exports = {
  sendNotification,
  sendBulkNotifications,
  initializeFirebase
};
