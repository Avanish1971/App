import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoattend.hrms',
  appName: 'Attendance_app',
  webDir: 'dist',
  server: {
    // 🚀 यह लाइन ऐप को सीधे तुम्हारे लाइव AWS सर्वर पर पॉइंट करेगी
    url: 'http://54.253.216.68:5000',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;