import "ts-node/register"; // NOTE: We need this to import TypeScript files
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Fenjoon",
  slug: "fenjoon",
  version: "0.1.6",
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
    versionCode: 19,
    package: "io.fenjoon.app",
    softwareKeyboardLayoutMode: "pan",
    googleServicesFile: "./google-services.json",
    blockedPermissions: ["android.permission.SYSTEM_ALERT_WINDOW"],
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
        image: "./assets/splash-light.png",
        backgroundColor: "#f5ece3",
        dark: {
          imageWidth: 256,
          image: "./assets/splash-dark.png",
          backgroundColor: "#2e2e2e",
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "c6549b03-c3a9-4b33-ba3f-10e6e87b043b",
    },
  },
};

export default config;
