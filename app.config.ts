import "ts-node/register"; // NOTE: We need this to import TypeScript files
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Fenjoon",
  slug: "fenjoon",
  version: "0.1.9",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  assetBundlePatterns: ["**/*"],
  newArchEnabled: true,
  scheme: "fenjoon",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "io.fenjoon.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: ["applinks:app.fenjoon.io"],
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#2e2e2e",
    },
    versionCode: 22,
    package: "io.fenjoon.app",
    softwareKeyboardLayoutMode: "pan",
    googleServicesFile: "./google-services.json",
    blockedPermissions: ["android.permission.SYSTEM_ALERT_WINDOW"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "fenjoon" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "app.fenjoon.io" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          minSdkVersion: 24,

          extraLocales: ["en"],

          minifyEnabled: true,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,

          useLegacyPackaging: false,

          buildArchs: ["arm64-v8a"],

          packagingOptions: {
            pickFirst: ["**/*.so"]
          }
        }
      }
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
