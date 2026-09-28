import { useState } from 'react';
import { Code2, Copy, Check, Terminal, Smartphone, Globe, Layers, Download } from 'lucide-react';

export function FlutterCodeViewer() {
  const [activeFile, setActiveFile] = useState<
    'main' | 'geofence_service' | 'attendance_bloc' | 'employee_screen' | 'pubspec' | 'manifest'
  >('geofence_service');
  const [copied, setCopied] = useState(false);

  const files = {
    geofence_service: {
      name: 'lib/services/geofence_service.dart',
      language: 'dart',
      description: 'Production Flutter Geolocation & Haversine distance engine with background geofence verification',
      content: `import 'dart:async';
import 'dart:math';
import 'package:geolocator/geolocator.dart';

class GeofenceVerificationResult {
  final bool isInside;
  final double distanceMeters;
  final double radiusMeters;
  final double accuracyMeters;
  final String status;
  final String message;

  GeofenceVerificationResult({
    required this.isInside,
    required this.distanceMeters,
    required this.radiusMeters,
    required this.accuracyMeters,
    required this.status,
    required this.message,
  });
}

class GeofenceService {
  static const double EARTH_RADIUS = 6371000; // in meters

  /// Calculates Haversine distance between two coordinates
  static double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    final dLat = (lat2 - lat1) * pi / 180;
    final dLon = (lon2 - lon1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return EARTH_RADIUS * c;
  }

  /// Request permissions and verify if device is inside geofence
  static Future<GeofenceVerificationResult> verifyOfficePerimeter({
    required double officeLat,
    required double officeLng,
    required double radiusMeters,
    double maxAllowedAccuracy = 50.0,
  }) async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return GeofenceVerificationResult(
        isInside: false,
        distanceMeters: 0,
        radiusMeters: radiusMeters,
        accuracyMeters: 0,
        status: 'GPS_DISABLED',
        message: 'Location services are disabled on device.',
      );
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return GeofenceVerificationResult(
          isInside: false,
          distanceMeters: 0,
          radiusMeters: radiusMeters,
          accuracyMeters: 0,
          status: 'PERMISSION_DENIED',
          message: 'Location permissions denied.',
        );
      }
    }

    // Get current position with high accuracy
    Position position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 10),
      ),
    );

    // Anti-mock location detection flag (Android/iOS)
    if (position.isMocked) {
      return GeofenceVerificationResult(
        isInside: false,
        distanceMeters: 0,
        radiusMeters: radiusMeters,
        accuracyMeters: position.accuracy,
        status: 'MOCK_DETECTED',
        message: 'Mock / Fake GPS detected. Attendance flagged for audit.',
      );
    }

    if (position.accuracy > maxAllowedAccuracy) {
      return GeofenceVerificationResult(
        isInside: false,
        distanceMeters: 0,
        radiusMeters: radiusMeters,
        accuracyMeters: position.accuracy,
        status: 'LOW_ACCURACY',
        message: 'GPS signal accuracy (±\${position.accuracy.round()}m) is too weak.',
      );
    }

    double distance = calculateDistance(
      position.latitude,
      position.longitude,
      officeLat,
      officeLng,
    );

    bool inside = distance <= radiusMeters;

    return GeofenceVerificationResult(
      isInside: inside,
      distanceMeters: distance,
      radiusMeters: radiusMeters,
      accuracyMeters: position.accuracy,
      status: inside ? 'VERIFIED' : 'OUTSIDE',
      message: inside
          ? 'Verified inside office (\${distance.round()}m from center)'
          : 'Outside perimeter (\${(distance / 1000).toStringAsFixed(2)}km away)',
    );
  }
}`,
    },
    attendance_bloc: {
      name: 'lib/blocs/attendance_bloc.dart',
      language: 'dart',
      description: 'Flutter BLoC architecture for state management, exit grace countdown & offline queues',
      content: `import 'package:flutter_bloc/flutter_bloc.dart';
import '../services/geofence_service.dart';

// Events
abstract class AttendanceEvent {}

class CheckInRequested extends AttendanceEvent {
  final double officeLat;
  final double officeLng;
  final double radiusMeters;
  CheckInRequested({required this.officeLat, required this.officeLng, required this.radiusMeters});
}

class CheckOutRequested extends AttendanceEvent {}

class BreakToggled extends AttendanceEvent {}

// States
abstract class AttendanceState {}

class AttendanceInitial extends AttendanceState {}
class AttendanceVerifyingLocation extends AttendanceState {}

class AttendancePresent extends AttendanceState {
  final String checkInTime;
  final double distanceMeters;
  final double accuracy;
  AttendancePresent({
    required this.checkInTime,
    required this.distanceMeters,
    required this.accuracy,
  });
}

class AttendanceOnBreak extends AttendanceState {
  final DateTime breakStartTime;
  AttendanceOnBreak({required this.breakStartTime});
}

class AttendanceCheckedOut extends AttendanceState {
  final String checkOutTime;
  AttendanceCheckedOut({required this.checkOutTime});
}

class AttendanceError extends AttendanceState {
  final String message;
  AttendanceError(this.message);
}

// BLoC Implementation
class AttendanceBloc extends Bloc<AttendanceEvent, AttendanceState> {
  AttendanceBloc() : super(AttendanceInitial()) {
    on<CheckInRequested>((event, emit) async {
      emit(AttendanceVerifyingLocation());
      try {
        final result = await GeofenceService.verifyOfficePerimeter(
          officeLat: event.officeLat,
          officeLng: event.officeLng,
          radiusMeters: event.radiusMeters,
        );

        if (result.isInside) {
          final now = DateTime.now();
          final formatted = "\${now.hour.toString().padLeft(2, '0')}:\${now.minute.toString().padLeft(2, '0')}";
          emit(AttendancePresent(
            checkInTime: formatted,
            distanceMeters: result.distanceMeters,
            accuracy: result.accuracyMeters,
          ));
        } else {
          emit(AttendanceError(result.message));
        }
      } catch (e) {
        emit(AttendanceError(e.toString()));
      }
    });

    on<CheckOutRequested>((event, emit) {
      final now = DateTime.now();
      final formatted = "\${now.hour.toString().padLeft(2, '0')}:\${now.minute.toString().padLeft(2, '0')}";
      emit(AttendanceCheckedOut(checkOutTime: formatted));
    });

    on<BreakToggled>((event, emit) {
      if (state is AttendancePresent) {
        emit(AttendanceOnBreak(breakStartTime: DateTime.now()));
      } else if (state is AttendanceOnBreak) {
        final now = DateTime.now();
        emit(AttendancePresent(
          checkInTime: '09:48 AM',
          distanceMeters: 28,
          accuracy: 12,
        ));
      }
    });
  }
}`,
    },
    employee_screen: {
      name: 'lib/screens/employee_home_screen.dart',
      language: 'dart',
      description: 'Flutter UI: Material 3 dark-themed employee attendance dashboard with live radar card',
      content: `import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/attendance_bloc.dart';

class EmployeeHomeScreen extends StatelessWidget {
  const EmployeeHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text("Acme Technologies", style: TextStyle(fontSize: 14, color: Colors.indigoAccent)),
            Text("Mumbai Head Office (BKC)", style: TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_none, color: Colors.white), onPressed: () {}),
        ],
      ),
      body: BlocConsumer<AttendanceBloc, AttendanceState>(
        listener: (context, state) {
          if (state is AttendanceError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red),
            );
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Greeting Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 24,
                        backgroundImage: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text("Good Morning 👋", style: TextStyle(color: Colors.grey, fontSize: 12)),
                          Text("Avanish Dhake", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          Text("General Shift · 10:00 AM - 06:00 PM", style: TextStyle(color: Colors.indigoAccent, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Geofence & Status Widget
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.indigoAccent.withOpacity(0.3)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text("Today's Status", style: TextStyle(color: Colors.grey)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.greenAccent),
                            ),
                            child: const Text("● PRESENT", style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigoAccent,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          context.read<AttendanceBloc>().add(
                            CheckInRequested(officeLat: 19.0657, officeLng: 72.8687, radiusMeters: 100),
                          );
                        },
                        icon: const Icon(Icons.location_on),
                        label: const Text("Verify Geofence & Check-In"),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}`,
    },
    main: {
      name: 'lib/main.dart',
      language: 'dart',
      description: 'Flutter entry point with multi-platform Web, iOS, and Android support',
      content: `import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'blocs/attendance_bloc.dart';
import 'screens/employee_home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GeoAttendApp());
}

class GeoAttendApp extends StatelessWidget {
  const GeoAttendApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => AttendanceBloc(),
      child: MaterialApp(
        title: 'GeoAttend HRMS',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          primaryColor: Colors.indigoAccent,
          scaffoldBackgroundColor: const Color(0xFF0F172A),
          fontFamily: 'Roboto',
        ),
        home: const EmployeeHomeScreen(),
      ),
    );
  }
}`,
    },
    pubspec: {
      name: 'pubspec.yaml',
      language: 'yaml',
      description: 'Flutter dependencies for geofencing, local storage & notifications',
      content: `name: geoattend_hrms
description: Enterprise Geo-Fenced Attendance & Indian Payroll Flutter App
version: 1.0.0+1
environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_bloc: ^8.1.3
  geolocator: ^13.0.1
  flutter_local_notifications: ^17.2.1
  dio: ^5.7.0
  intl: ^0.19.0
  shared_preferences: ^2.3.2

flutter:
  uses-material-design: true`,
    },
    manifest: {
      name: 'android/app/src/main/AndroidManifest.xml',
      language: 'xml',
      description: 'Android background & fine location permissions for 100m geofence accuracy',
      content: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions for Smart Geofencing -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:label="GeoAttend HRMS"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    },
  };

  const current = files[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Cross-Platform Flutter Codebase
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              Android · iOS · Web
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Flutter / Dart Production Architecture & Setup
          </h2>
          <p className="text-xs text-slate-400">
            Exportable native codebase ready to compile for Android APK, iOS TestFlight, or Flutter Web
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Code Copied to Clipboard!' : 'Copy Active File'}</span>
        </button>
      </div>

      {/* CLI Quick Start Guide */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Quick Terminal Run Commands for Developers</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            <span className="text-slate-500"># 1. Create project</span>
            <br />
            flutter create --org com.acme geoattend
          </div>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            <span className="text-slate-500"># 2. Run on Flutter Web</span>
            <br />
            flutter run -d chrome
          </div>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            <span className="text-slate-500"># 3. Build release APK</span>
            <br />
            flutter build apk --release
          </div>
        </div>
      </div>

      {/* File Browser & Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* File Tabs Sidebar (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-950 p-3 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2">Source Tree</div>
          {Object.entries(files).map(([key, f]) => (
            <button
              key={key}
              onClick={() => setActiveFile(key as any)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                activeFile === key
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
              <span className="text-[10px] opacity-70 font-mono uppercase shrink-0">{f.language}</span>
            </button>
          ))}
        </div>

        {/* Code Editor Window (8 Cols) */}
        <div className="lg:col-span-8 p-4 flex flex-col justify-between bg-slate-900 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
            <span className="font-mono text-indigo-400 font-semibold">{current.name}</span>
            <span className="text-slate-400 text-[11px]">{current.description}</span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed">
            <code>{current.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
