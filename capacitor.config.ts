import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoattend.hrms',
  appName: 'Attendance_app',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: true },
};

export default config;
