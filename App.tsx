import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { SafeAreaView, View, StyleSheet } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#2e2e2e" }}>
        <WebView
          bounces={false}
          userAgent="Fenjoon-WebView"
          source={{ uri: "https://fenjoon.vercel.app" }}
          style={{ flex: 1, backgroundColor: "#2e2e2e" }}
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
