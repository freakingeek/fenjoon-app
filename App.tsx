import "./vendor/fetch";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import { useRef, useState, useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { Linking, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { View, BackHandler, Keyboard, Platform } from "react-native";
import { StatusBar, setStatusBarBackgroundColor } from "expo-status-bar";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

export default function App() {
  const webViewRef = useRef(null);
  const colorScheme = useColorScheme();
  const [canGoBack, setCanGoBack] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardDuration, setKeyboardDuration] = useState(300); // 300ms
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const { expoPushToken, sendScheduleNotification } = usePushNotifications();

  const backgroundColor = colorScheme === "dark" ? "#2e2e2e" : "#f5ece3";

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardDuration(e.duration || (Platform.OS === 'ios' ? 300 : 250));
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardDuration(Platform.OS === 'ios' ? 250 : 200);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isWebViewLoaded || !webViewRef.current) return;

    const jsCode = `
      window.dispatchEvent(new CustomEvent('keyboardHeightChange', { detail: { height: ${keyboardHeight}, duration: ${keyboardDuration} } }));
      true;
    `;
    webViewRef.current.injectJavaScript(jsCode);
  }, [keyboardHeight, keyboardDuration, isWebViewLoaded]);

  useEffect(() => {
    const setNavigationBarColor = async () => {
      setStatusBarBackgroundColor(backgroundColor, true);
      await NavigationBar.setBackgroundColorAsync(backgroundColor);
      await NavigationBar.setButtonStyleAsync(colorScheme === "dark" ? "light" : "dark");
    };

    setNavigationBarColor();
  }, [colorScheme]);

  useEffect(() => {
    if (!expoPushToken?.data || !webViewRef.current || !isWebViewLoaded) return;

    webViewRef.current.injectJavaScript(
      `window.expoPushToken=${JSON.stringify(expoPushToken.data)};`
    );
  }, [expoPushToken?.data, isWebViewLoaded]);

  useEffect(() => {
    const backAction = () => {
      if (!(canGoBack && webViewRef.current)) {
        return;
      }

      webViewRef.current.goBack();
      return true; // Prevent app from closing
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => {
      backHandler.remove();
    };
  }, [canGoBack]);

  useEffect(() => {
    sendScheduleNotification({
      identifier: "reminder",
      content: { title: "خوندن داستان‌های امروز یادت نره!" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 16,
        minute: 10,
        channelId: "silent",
      },
    }).catch(() => {});
  }, []);

  const share = async (data: { url?: string }) => {
    if (!data.url) return;

    try {
      const base64Data = data.url.split(",")[1];
      const filePath = `${FileSystem.cacheDirectory}/temp_image_${Date.now()}.png`;

      await FileSystem.writeAsStringAsync(filePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        return;
      }

      await Sharing.shareAsync(filePath, {
        mimeType: "image/png",
        dialogTitle: "اشتراک‌گذاری داستان",
        UTI: "image.png",
      });
    } catch {}
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, ...payload } = JSON.parse(event.nativeEvent.data) as Record<string, string>;

    if (type === "share") {
      share(payload);
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    if (request.url.startsWith("https://app.fenjoon.io")) {
      return true;
    }

    Linking.openURL(request.url);
    return false;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <WebView
          textZoom={100}
          bounces={false}
          ref={webViewRef}
          overScrollMode="never"
          userAgent="Fenjoon-WebView"
          style={{ flex: 1, backgroundColor }}
          source={{ uri: "https://app.fenjoon.io?utm_source=direct" }}
          onMessage={handleMessage}
          onLoadEnd={() => setIsWebViewLoaded(true)}
          onNavigationStateChange={({ canGoBack }) => setCanGoBack(canGoBack)}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        />
        <StatusBar backgroundColor={backgroundColor} />
      </View>
    </SafeAreaView>
  );
}