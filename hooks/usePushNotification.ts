import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

// Controls how notifications behave when the app is open (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Must use a physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Android requires a notification channel to be set for notifications to show properly
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F5A623", // CRAFTD gold
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log(
      "No EAS projectId found. Run `eas init` in the project root, then try again."
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data; // e.g. "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  } catch (error) {
    console.log("Error getting push token:", error);
    return null;
  }
}

async function savePushTokenToBackend(
  token: string,
  apiBaseUrl: string,
  accessToken: string
) {
  try {
    const response = await fetch(`${apiBaseUrl}/app/save-push-token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ push_token: token }),
    });

    if (!response.ok) {
      console.log("Failed to save push token:", await response.text());
    } else {
      console.log("Push token saved successfully");
    }
  } catch (error) {
    console.log("Error saving push token to backend:", error);
  }
}

/**
 * Call this hook once after the user is logged in (e.g. in your
 * home screen or a top-level authenticated layout).
 *
 * Usage:
 *   usePushNotifications(API_BASE_URL, accessToken);
 */
export function usePushNotifications(
  apiBaseUrl: string,
  accessToken: string | null
) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );

  useEffect(() => {
    if (!accessToken) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        savePushTokenToBackend(token, apiBaseUrl, accessToken);
      }
    });

    // Fires when a notification is received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Fires when the user taps on a notification (foreground, background, or killed state)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped, data:", data);
        // Deep-link handling goes here later, e.g.:
        // if (data.type === "booking") router.push(`/received-bookings`);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [accessToken]);

  return { expoPushToken };
}