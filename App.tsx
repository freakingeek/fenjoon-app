import * as Sharing from 'expo-sharing'
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system";
import { View, BackHandler } from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2e2e2e" }}>
      <View style={{ flex: 1, backgroundColor: "#2e2e2e" }}>
        <WebView
          bounces={false}
          ref={webViewRef}
          overScrollMode='never'
          userAgent="Fenjoon-WebView"
          source={{ uri: "https://fenjoon.vercel.app" }}
          style={{ flex: 1, backgroundColor: "#2e2e2e" }}
          onNavigationStateChange={({ canGoBack }) => setCanGoBack(canGoBack)}
          onMessage={handleMessage}
        />
        <StatusBar />
      </View>
    </SafeAreaView>
  );
}