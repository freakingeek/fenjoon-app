import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView, View, StyleSheet, BackHandler } from "react-native";

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
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#2e2e2e" }}>
        <WebView
          bounces={false}
          userAgent="Fenjoon-WebView"
          source={{ uri: "https://fenjoon.vercel.app" }}
          style={{ flex: 1, backgroundColor: "#2e2e2e" }}
          onNavigationStateChange={({ canGoBack }) => setCanGoBack(canGoBack)}
        />
        <StatusBar />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2e2e2e",
  },
});
