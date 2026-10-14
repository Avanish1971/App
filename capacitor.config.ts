import type { CapacitorConfig } from '@capacitor/cli';

// APK AWS wali web ko kholega. Isliye AWS par update karne se app me update aayega.
const config: CapacitorConfig = {
  appId: 'com.geoattend.hrms',
  appName: 'Attendance_app',
  webDir: 'dist',
  server: {
    url: 'http://54.253.216.68:3000',
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;