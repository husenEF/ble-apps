import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useColorScheme,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import useConnect from './src/service/useBleConnect';
import {Device} from 'react-native-ble-plx';

export default function MainApps() {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    width: '100%',
  };

  const {
    connectToDevice,
    requestPermissions,
    isScanning,
    data: devices,
    connectedDeviceItems: connectedDevice,
    stopScanning,
    startScanning,
    disconnectFromDevice,
    waitUntilBluetoothReady,
    bluetoothState,
  } = useConnect();

  useEffect(() => {
    console.log({L50: bluetoothState});

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDeviceName = (device: Device): string => {
    if (device.name !== null) {
      return device.name as string;
    } else if (device.localName !== null) {
      return device.localName as string;
    } else {
      console.log({device});
      return 'Unknown Device';
    }
  };

  const startScan = async () => {
    try {
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) {
        console.error('Bluetooth permissions are not granted.');
        Alert.alert(
          'Permissions Required',
          'Bluetooth permissions are required to scan for devices. Please enable them in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ],
        );
        return;
      }

      const isReady = await waitUntilBluetoothReady();
      if (isReady) {
        console.log('Bluetooth is ready. Starting scan...');
        startScanning();
      }
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      Alert.alert(
        'Bluetooth not ready',
        'BluetoothPlease enable Bluetooth in your device settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open Bluetooth Settings',
            onPress: () => {
              Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
            },
          },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundStyle.backgroundColor}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BLE Manager</Text>
      </View>

      {/* Scan Button */}
      <TouchableOpacity
        style={[
          styles.scanButton,
          isScanning ? styles.scanningButton : styles.startButton,
        ]}
        onPress={startScan}
        accessibilityRole="button"
        accessibilityState={{selected: isScanning}}
        accessibilityLabel={
          isScanning
            ? 'Stop scanning for devices'
            : 'Start scanning for devices'
        }>
        <Text style={styles.buttonText}>
          {isScanning ? 'Stop Scan' : 'Start Scan'}
        </Text>
      </TouchableOpacity>

      {/* Devices List */}
      <ScrollView style={styles.deviceList}>
        {devices.map(device => (
          <TouchableOpacity
            key={device.id}
            style={styles.deviceItem}
            accessibilityRole="button"
            accessibilityLabel={`Connect to ${device.name}, signal strength ${device.rssi} dBm`}>
            <View style={styles.deviceInfo}>
              <View style={styles.deviceDetails}>
                <Text style={styles.deviceName}>{getDeviceName(device)}</Text>
                <Text style={styles.deviceRSSI}>Signal: {device.rssi} dBm</Text>
              </View>
            </View>
            <Pressable onPress={() => connectToDevice(device)}>
              <Text style={styles.connectButton}>Connect</Text>
            </Pressable>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scanning Indicator */}
      {isScanning && (
        <View style={styles.scanningIndicator}>
          <Text style={styles.scanningText}>Scanning for devices...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  scanButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
  },
  scanningButton: {
    backgroundColor: '#dc2626',
  },
  startButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceList: {
    flex: 1,
    padding: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceDetails: {
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  deviceRSSI: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  connectButton: {
    color: '#2563eb',
    fontWeight: '600',
  },
  scanningIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: '#2563eb',
  },
  scanningText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});
