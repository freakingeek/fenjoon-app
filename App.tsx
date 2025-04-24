import "./vendor/fetch";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { View, BackHandler } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useRef, useState, useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { Linking, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { StatusBar, setStatusBarBackgroundColor } from "expo-status-bar";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const webViewRef = useRef(null);
  const colorScheme = useColorScheme();
  const { expoPushToken } = usePushNotifications();
  const [canGoBack, setCanGoBack] = useState(false);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);

  const backgroundColor = colorScheme === "dark" ? "#2e2e2e" : "#f5ece3";

  useEffect(() => {
    const setNavigationBarColor = async () => {
      setStatusBarBackgroundColor(backgroundColor, true);

      await NavigationBar.setBackgroundColorAsync(backgroundColor);
      await NavigationBar.setButtonStyleAsync(colorScheme === "dark" ? "light" : "dark");

      await SplashScreen.hideAsync().catch(() => {});
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
    if (request.url.startsWith("https://app.fnjo.ir")) {
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
          source={{ uri: "https://app.fnjo.ir" }}
          style={{ flex: 1, backgroundColor }}
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
