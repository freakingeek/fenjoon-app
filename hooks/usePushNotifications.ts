import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRef, useState, useEffect, useCallback } from "react";

export interface PushNotificationsState {
  notification?: Notifications.Notification;
  expoPushToken?: Notifications.ExpoPushToken;
  requestPermissions: () => Promise<boolean>;
  sendScheduleNotification: (
    input: Notifications.NotificationRequestInput
  ) => Promise<string | undefined>;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldShowAlert: true,
    shouldSetBadge: false,
  }),
});

/**
 * Hook to manage push notifications in an Expo app
 * @returns PushNotificationsState object containing notification state and utility functions
 */
export const usePushNotifications = (): PushNotificationsState => {
  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken>();
  const [notification, setNotification] = useState<Notifications.Notification>();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  /**
   * Request permission and register for push notifications
   * @returns Promise resolving to true if permissions granted, false otherwise
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.warn("Push notifications require a physical device");
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
        console.log("Push notification permissions denied");
        return false;
      }

      if (Platform.OS === "android") {
        await setupAndroidChannels();
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error("Missing EAS project ID in app config");
        return false;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setExpoPushToken(token);
      return true;
    } catch (error) {
      console.error("Error setting up push notifications:", error);
      return false;
    }
  }, []);

  const setupAndroidChannels = async (): Promise<void> => {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });

    await Notifications.setNotificationChannelAsync("silent", {
      name: "Silent",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0],
      enableVibrate: false,
      sound: null,
    });
  };

  /**
   * Schedule a local notification
   * @param input Notification request configuration
   * @returns Promise resolving to notification identifier or undefined if failed
   */
  const sendScheduleNotification = useCallback(
    async (input: Notifications.NotificationRequestInput): Promise<string | undefined> => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== Notifications.PermissionStatus.GRANTED) {
          console.warn("Cannot schedule notification: permissions not granted");
          return undefined;
        }

        if (input.identifier) {
          await Notifications.cancelScheduledNotificationAsync(input.identifier);
        }

        return await Notifications.scheduleNotificationAsync(input);
      } catch (error) {
        console.error("Failed to schedule notification:", error);
        return undefined;
      }
    },
    []
  );

  useEffect(() => {
    requestPermissions();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (receivedNotification) => {
        setNotification(receivedNotification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification: responseNotification } = response;
      console.log("Notification response:", response.actionIdentifier);
      setNotification(responseNotification);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    requestPermissions,
    sendScheduleNotification,
  };
};
