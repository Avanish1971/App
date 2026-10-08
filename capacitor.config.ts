import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoattend.hrms',
  appName: 'Attendance_app',
  webDir: 'dist',
  server: {
    // 🚀 Yeh aapke live production server ko point karega
    url: 'http://54.253.216.68:3000',
    cleartext: true,
    // 🔴 CRUCIAL FIX: androidScheme ko 'https' rakhna zaroori hai native proxy bypass ke liye
    androidScheme: 'https',
    allowNavigation: [
      '54.253.216.68:3000',
      '54.253.216.68:5000',
      '*.54.253.216.68'
    ]
  }
};

export default config;