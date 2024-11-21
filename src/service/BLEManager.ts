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

    this.manager.startDeviceScan(
      null,
      {allowDuplicates: false},
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          onError(error);
          this.stopScanning();
          return;
        }

        if (device) {
          onDeviceDiscovered(device);
        }
      },
    );
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

  async connectToDevice(device: Device): Promise<Device | null> {
    try {
      if (this.scanning) {
        this.manager.stopDeviceScan();
        this.scanning = false;
      }

      // Attempt to connect to the device
      const connectedDevice = await this.manager.connectToDevice(device.id);

      // Discover services and characteristics after connecting
      await connectedDevice.discoverAllServicesAndCharacteristics();

      console.log(
        `Successfully connected to device: ${
          connectedDevice.name || 'Unknown Device'
        }`,
      );
      return connectedDevice;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      return null; // Return null if the connection fails
    }
  }

  async disconnectFromDevice(device: Device): Promise<void> {
    try {
      await this.manager.cancelDeviceConnection(device.id);
      console.log('Disconnected from device:', device.name);
    } catch (error) {
      console.error('Failed to disconnect from device:', error);
    }
  }
}

export default new BLEManager();
