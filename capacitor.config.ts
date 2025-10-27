import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.anufy.app',
  appName: 'Anufy',
  webDir: 'public',

  // Server configuration - Point to deployed app
  server: {
    url: 'https://socialmediabackendfinalss.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: ['*']
  },

  // iOS specific configuration
  ios: {
    contentInset: 'always',
    // Use WKWebView for better performance
    preferredContentMode: 'mobile',
    // Disable bounce effect
    scrollEnabled: true,
    // Allow inline media playback
    allowsInlineMediaPlayback: true,
    // Suppress incremental rendering
    suppressesIncrementalRendering: false,
    // Limit navigation to app domain
    limitsNavigationsToAppBoundDomains: false
  },

  // Android specific configuration
  android: {
    // Allow mixed content for development
    allowMixedContent: true,
    // Capture back button
    captureInput: true,
    // Use WebView for better compatibility
    webContentsDebuggingEnabled: true,
    // Initial focus
    initialFocus: true,
    // Background color
    backgroundColor: '#000000',
    // Hardware acceleration
    hardwareAccelerated: true
  },

  // Plugin configurations
  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },

    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#2dd4bf',
      sound: 'default'
    },

    // Badge
    Badge: {
      persist: true,
      autoClear: false
    },

    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#2dd4bf',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true
    },

    // Status Bar
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: false
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },

    // Camera
    Camera: {
      presentationStyle: 'fullscreen',
      quality: 90,
      allowEditing: true,
      resultType: 'uri',
      saveToGallery: false,
      correctOrientation: true
    },

    // App
    App: {
      launchUrl: undefined,
      iosScheme: 'https',
      androidScheme: 'https'
    },

    // Filesystem
    Filesystem: {
      iosScheme: 'https',
      androidScheme: 'https'
    },

    // Network
    Network: {
      // No specific config needed
    },

    // Haptics
    Haptics: {
      // No specific config needed
    },

    // Share
    Share: {
      // No specific config needed
    }
  }
}

export default config
