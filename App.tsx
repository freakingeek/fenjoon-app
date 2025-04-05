import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import * as FileSystem from "expo-file-system";
import { View, BackHandler } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePushNotifications } from "./hooks/usePushNotifications";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import React, { useRef, useState, useEffect, useLayoutEffect } from "react";

export default function App() {
  const webViewRef = useRef(null);
  const colorScheme = useColorScheme();
  const { expoPushToken } = usePushNotifications();
  const [canGoBack, setCanGoBack] = useState(false);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);

  const backgroundColor = colorScheme === "dark" ? "#2e2e2e" : "#f5ece3";

  useLayoutEffect(() => {
    NavigationBar.setBackgroundColorAsync(backgroundColor);
    NavigationBar.setButtonStyleAsync(
      colorScheme === "dark" ? "light" : "dark"
    );

    if (webViewRef.current) {
      const themeScript = `
          document.documentElement.setAttribute('data-theme', '${colorScheme}');
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add('${colorScheme}');
          true;
        `;
      webViewRef.current.injectJavaScript(themeScript);
    }
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

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => {
      backHandler.remove();
    };
  }, [canGoBack]);

  const share = async (data: { url?: string }) => {
    if (!data.url) return;

    try {
      const base64Data = data.url.split(",")[1];
      const filePath = `${
        FileSystem.cacheDirectory
      }/temp_image_${Date.now()}.png`;

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
    const { type, ...payload } = JSON.parse(event.nativeEvent.data) as Record<
      string,
      string
    >;

    if (type === "share") {
      share(payload);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <View style={{ flex: 1, backgroundColor }}>
        <WebView
          textZoom={100}
          bounces={false}
          ref={webViewRef}
          overScrollMode="never"
          userAgent={`Fenjoon-WebView-${colorScheme}`}
          source={{ uri: "https://fenjoon.vercel.app" }}
          style={{ flex: 1, backgroundColor }}
          onMessage={handleMessage}
          onLoadEnd={() => setIsWebViewLoaded(true)}
          onNavigationStateChange={({ canGoBack }) => setCanGoBack(canGoBack)}
        />

        <StatusBar backgroundColor={backgroundColor} />
      </View>
    </SafeAreaView>
  );
}
