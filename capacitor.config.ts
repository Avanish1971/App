import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoattend.hrms',
  appName: 'Attendance_app',
  webDir: 'dist',
  server: {
    // 🚀 यहाँ पोर्ट 3000 होना चाहिए ताकि मोबाइल ऐप सीधे लाइव एडमिन वेबसाइट का लेआउट लोड करे
    url: 'http://54.253.216.68:3000',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;