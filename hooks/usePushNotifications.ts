import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRef, useState, useEffect } from "react";

export interface PushNotificationsState {
  notification?: Notifications.Notification;
  expoPushToken?: Notifications.ExpoPushToken;
}

export const usePushNotifications = (): PushNotificationsState => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldShowAlert: true,
      shouldSetBadge: false,
    }),
  });

  const [expoPushToken, setExpoPushToken] =
    useState<Notifications.ExpoPushToken>();
  const [notification, setNotification] =
    useState<Notifications.Notification>();

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  async function registerForPushNotificationsAsync() {
    let token: Notifications.ExpoPushToken;

    if (!Device.isDevice) {
      console.warn("Please use a physical device to receive notifications");
      return;
    }

    const { status: getPermissionsStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = getPermissionsStatus;

    if (getPermissionsStatus !== "granted") {
      const { status: requestPermissionsStatus } =
        await Notifications.requestPermissionsAsync();
      finalStatus = requestPermissionsStatus;
    }

    if (finalStatus !== "granted") {
      return;
    }

    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );

      Notifications.removeNotificationSubscription(responseListener.current);
    };
  });

  return { expoPushToken, notification };
};
