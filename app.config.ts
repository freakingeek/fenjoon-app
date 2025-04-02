import "ts-node/register"; // NOTE: We need this to import TypeScript files
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Fenjoon",
  slug: "fenjoon",
  version: "0.1.3",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  assetBundlePatterns: ["**/*"],
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "io.fenjoon.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#2e2e2e",
    },
    package: "io.fenjoon.app",
    softwareKeyboardLayoutMode: "pan",
    googleServicesFile: "./google-services.json",
    blockedPermissions: ["android.permission.SYSTEM_ALERT_WINDOW"],
  },
  androidStatusBar: {
    translucent: false,
  },
  androidNavigationBar: {
    barStyle: "light-content",
    backgroundColor: "#2e2e2e",
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          debuggable: false,
          minifyEnabled: true,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          useLegacyPackaging: true,
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        imageWidth: 256,
        backgroundColor: "#2e2e2e",
        image: "./assets/splash.png",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "08876034-7fa0-4eb2-ac38-972567bc659a",
    },
  },
};

export default config;
