import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2e2e2e" }}>
      <View style={styles.container}>
        <WebView
          bounces={false}
          ref={webViewRef}
          userAgent="Fenjoon-WebView"
          source={{ uri: "https://fenjoon.vercel.app" }}
          style={{ flex: 1, backgroundColor: "#2e2e2e" }}
          onNavigationStateChange={({ canGoBack }) => setCanGoBack(canGoBack)}
        />
        <StatusBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2e2e2e",
  },
});
