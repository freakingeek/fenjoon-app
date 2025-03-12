import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system";
import { View, BackHandler, Alert } from "react-native";
import CookieManager from "@react-native-cookies/cookies";
import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

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

    return () => backHandler.remove();
  }, [canGoBack]);

  useEffect(() => {
    CookieManager.set("https://fenjoon.vercel.app", {
      name: "isWebView",
      value: "true",
      path: "/",
      httpOnly: false,
      secure: false,
    });
  }, []);

  const share = async (data: {
    title?: string;
    message?: string;
    url?: string;
    image?: string;
  }) => {
    if (!data.image) return;

    try {
      const fileUri = `${FileSystem.cacheDirectory}fenjoon-story.png`;

      // Convert Base64 to a local file
      await FileSystem.writeAsStringAsync(fileUri, data.image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Ensure sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on this device.");
        return;
      }

      // Share the locally saved image
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Error", "Failed to share image.");
      console.error(error);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data) as Record<string, string>;
    if (data.type === "share") {
      Alert.alert("data: ", event.nativeEvent.data);
      share(data);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2e2e2e" }}>
      <View style={{ flex: 1 }}>
        <WebView
          bounces={false}
          ref={webViewRef}
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
