import {BleManager, Device} from 'react-native-ble-plx';
import {Platform, PermissionsAndroid} from 'react-native';

class BLEManager {
  private manager: BleManager;
  private scanning: boolean;

  constructor() {
    this.manager = new BleManager();
    this.scanning = false;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      return (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  }

  startScanning(
    onDeviceDiscovered: (device: Device) => void,
    onError: (error: Error) => void,
  ) {
    if (this.scanning) {
      console.log('Already scanning');
      return;
    }

    this.scanning = true;
    console.log('Starting scan...');

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        onError(error);
        this.stopScanning();
        return;
      }

      if (device) {
        onDeviceDiscovered(device);
      }
    });
  }

  stopScanning() {
    if (!this.scanning) {
      console.log('Not scanning');
      return;
    }

    console.log('Stopping scan...');
    this.manager.stopDeviceScan();
    this.scanning = false;
  }

  destroy() {
    this.manager.destroy();
  }
}

export default new BLEManager();
