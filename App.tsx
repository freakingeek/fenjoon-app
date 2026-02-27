import "./vendor/fetch";
import { share } from "./utils/share";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useRef, useState, useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { Linking, useColorScheme } from "react-native";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { View, BackHandler, Keyboard, Platform } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

const BASE_URL = "https://app.fenjoon.io";

function parseFenjoonDeepLink(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Handle https://app.fenjoon.io URLs directly
    if (parsed.protocol === "https:" && parsed.hostname === "app.fenjoon.io") {
      return url;
    }

    // Handle fenjoon:// custom scheme URLs
    if (parsed.protocol !== "fenjoon:") return null;

    // fenjoon://boost -> /boost
    // fenjoon://stories/boost -> /stories/boost
    // fenjoon://profile?username=ava -> /profile?username=ava
    let path = "";

    if (parsed.hostname) {
      // If there's a hostname, start with it
      path = `/${parsed.hostname}`;
      // Append pathname if it exists and is not just "/"
      if (parsed.pathname && parsed.pathname !== "/") {
        path += parsed.pathname;
      }
    } else if (parsed.pathname && parsed.pathname !== "/") {
      // If no hostname but there's a pathname, use it
      path = parsed.pathname;
    }

    return `${BASE_URL}${path}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export default function App() {
  const webViewRef = useRef(null);
  const colorScheme = useColorScheme();
  const isWebViewLoadedRef = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardDuration, setKeyboardDuration] = useState(300); // 300ms
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const { expoPushToken, sendScheduleNotification } = usePushNotifications();
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);

  const backgroundColor = colorScheme === "dark" ? "#2e2e2e" : "#f5ece3";

  useEffect(() => {
    if (Platform.OS !== "android") return;

    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setVisibilityAsync("visible");
    NavigationBar.setBehaviorAsync("overlay-swipe");
    NavigationBar.setBackgroundColorAsync("transparent");
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    NavigationBar.setButtonStyleAsync(colorScheme === "dark" ? "light" : "dark");
  }, [colorScheme]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardDuration(e.duration || (Platform.OS === "ios" ? 300 : 250));
    });

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      setKeyboardDuration(Platform.OS === "ios" ? 250 : 200);
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
    if (!expoPushToken?.data || !webViewRef.current || !isWebViewLoaded) return;

    webViewRef.current.injectJavaScript(
      `window.expoPushToken=${JSON.stringify(expoPushToken.data)};`,
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
    }).catch(() => { });
  }, []);

  useEffect(() => {
    // App cold start
    Linking.getInitialURL().then((url) => {
      if (url && (url.startsWith("fenjoon://") || url.startsWith("https://app.fenjoon.io"))) {
        handleDeepLink(url);
      }
    });

    // App running
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("fenjoon://") || url.startsWith("https://app.fenjoon.io")) {
        handleDeepLink(url);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    isWebViewLoadedRef.current = isWebViewLoaded;
  }, [isWebViewLoaded]);

  useEffect(() => {
    if (pendingDeepLink && isWebViewLoaded) {
      sendRouteToWebView(pendingDeepLink);
      setPendingDeepLink(null);
    }
  }, [pendingDeepLink, isWebViewLoaded]);

  function sendRouteToWebView(url: string) {
    if (!webViewRef.current) return;

    // Small delay to ensure WebView JavaScript context is ready
    setTimeout(() => {
      if (!webViewRef.current) return;

      // Send message to WebView content via injected JavaScript
      const messageData = JSON.stringify({ type: "deep-link", url });
      const jsCode = `
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify(messageData)}
        }));
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }, 100);
  }

  function handleDeepLink(url: string) {
    const targetUrl = parseFenjoonDeepLink(url);
    if (!targetUrl) return;

    if (!isWebViewLoadedRef.current || !webViewRef.current) {
      setPendingDeepLink(targetUrl);
      return;
    }

    sendRouteToWebView(targetUrl);
    setPendingDeepLink(null);
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    const { type, ...payload } = JSON.parse(event.nativeEvent.data) as Record<string, string>;

    if (type === "share") {
      share(payload);
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const url = request.url;

    // Allow Fenjoon web app
    if (url.startsWith(BASE_URL)) return true;

    // Prevent fenjoon:// from opening browser
    if (url.startsWith("fenjoon://")) return false;

    // Allow internal WebView URLs
    if (url === "about:blank" || url.startsWith("data:") || url.startsWith("file://")) {
      return true;
    }

    // External links → browser
    Linking.openURL(url).catch(() => { });

    return false;
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar
        animated
        translucent={false}
        backgroundColor="transparent"
        style={colorScheme === "dark" ? "light" : "dark"}
      />

      <WebView
        textZoom={100}
        bounces={false}
        ref={webViewRef}
        overScrollMode="never"
        androidLayerType="hardware"
        userAgent="Fenjoon-WebView"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor }}
        containerStyle={{ backgroundColor }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        source={{ uri: `${BASE_URL}?utm_source=direct` }}
        onMessage={handleMessage}
        onLoadEnd={() => setIsWebViewLoaded(true)}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onNavigationStateChange={({ canGoBack }) => setCanGoBack(canGoBack)}
      />
    </View>
  );
}
