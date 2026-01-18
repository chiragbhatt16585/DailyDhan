// src/utils/notifications.js
// Android-only local notifications for inactivity reminders

import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_ACTIVITY_KEY = '@dailydhan_last_activity';
const REMINDER_NOTIFICATION_ID = 1001; // constant ID so we can cancel/update
const INACTIVITY_DAYS = 2; // remind after 2 days of no activity

export const initNotifications = () => {
  // Create notification channel on Android
  PushNotification.createChannel(
    {
      channelId: 'dailydhan-reminders',
      channelName: 'DailyDhan Reminders',
      channelDescription: 'Reminders to update your income and expenses',
      importance: 4,
      vibrate: true,
    },
    created => {
      // eslint-disable-next-line no-console
      console.log('Notification channel created:', created);
    },
  );

  // Request permission on Android 13+
  try {
    const permissionPromise = PushNotification.requestPermissions();
    if (permissionPromise && typeof permissionPromise.catch === 'function') {
      permissionPromise.catch(err => {
        // eslint-disable-next-line no-console
        console.warn('Notification permission request failed:', err);
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Notification permission request error:', err);
  }
};

const scheduleInactivityReminder = async () => {
  // Cancel any existing reminder first
  try {
    PushNotification.cancelLocalNotification(REMINDER_NOTIFICATION_ID);
  } catch (e) {
    // ignore if none exists
  }

  const now = Date.now();
  const triggerTime = now + INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

  PushNotification.localNotificationSchedule({
    id: REMINDER_NOTIFICATION_ID,
    channelId: 'dailydhan-reminders',
    title: 'DailyDhan reminder',
    message: "You haven't updated your income/expenses for a while.",
    bigText: 'Open DailyDhan now to add your latest income and expenses.',
    date: new Date(triggerTime),
    playSound: true,
    soundName: 'default',
  });
};

export const recordActivityAndScheduleReminder = async () => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_ACTIVITY_KEY, now);
    await scheduleInactivityReminder();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to record activity or schedule reminder:', e);
  }
};

// TEST FUNCTION: Schedule a notification in 10 seconds (for testing only)
export const testNotification = () => {
  try {
    console.log('🧪 Testing notification - will appear in 10 seconds...');
    
    // Cancel any existing test notification
    PushNotification.cancelLocalNotification(9999);
    
    const testTime = new Date(Date.now() + 10 * 1000); // 10 seconds from now
    
    PushNotification.localNotificationSchedule({
      id: 9999, // Different ID so it doesn't conflict with real reminders
      channelId: 'dailydhan-reminders',
      title: 'DailyDhan Reminder',
      message: "You haven't updated your income/expenses for a while.",
      bigText: 'Open DailyDhan now to add your latest income and expenses.',
      date: testTime,
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });
    
    console.log('✅ Test notification scheduled for:', testTime.toLocaleTimeString());
  } catch (e) {
    console.error('❌ Test notification failed:', e);
  }
};