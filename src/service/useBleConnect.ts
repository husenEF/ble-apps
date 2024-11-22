import {useEffect, useState} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import {BleManager, type Device} from 'react-native-ble-plx';

interface PropConnect {
  data: Device[];
  connectedDeviceItems: Device[];
  isScanning: boolean;
  bluetoothState: string | null;
  isBluetoothReady: boolean;
  requestPermissions: () => Promise<boolean>;
  startScanning: () => void;
  stopScanning: () => void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectFromDevice: (device: Device) => Promise<void>;
  waitUntilBluetoothReady: () => Promise<boolean>;
}

const useConnect = (): PropConnect => {
  const [manager] = useState<BleManager>(new BleManager());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [data, setData] = useState<Device[]>([]);
  const [connectedDeviceItems, setConnectedDeviceItems] = useState<Device[]>(
    [],
  );
  const [bluetoothState, setBluetoothState] = useState<string | null>(null);
  const [isBluetoothReady, setIsBluetoothReady] = useState(false);

  useEffect(() => {
    const subscription = manager.onStateChange(state => {
      console.log(`Bluetooth state changed: ${state}`);
      setBluetoothState(state);

      if (state === 'PoweredOn') {
        setIsBluetoothReady(true);
      } else {
        setIsBluetoothReady(false);
      }
    }, true); // Check the current state immediately.

    return () => {
      console.log('Cleaning up BLE manager...');
      subscription.remove();
      manager.destroy();
    };
  }, [manager]);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const permissions =
        Platform.Version >= 31
          ? [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]
          : [
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      console.log('Granted:', granted);

      return permissions.every(
        permission =>
          granted[permission] === PermissionsAndroid.RESULTS.GRANTED,
      );
    }
    return true;
  };

  const stopScanning = () => {
    if (!isScanning) {
      console.log('Not scanning');
      return;
    }
    console.log('Stopping scan...');
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  const waitUntilBluetoothReady = async (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const subscription = manager.onStateChange(state => {
        console.log(`Bluetooth state: ${state}`);
        if (state === 'PoweredOn') {
          subscription.remove(); // Remove the listener once the state is "PoweredOn"
          resolve(true);
        } else if (
          state === 'Unauthorized' ||
          state === 'Unsupported' ||
          state === 'PoweredOff'
        ) {
          subscription.remove();
          reject(new Error(`Bluetooth state: ${state}`));
        }
      }, true); // The second argument "true" triggers the current state immediately.
    });
  };

  const startScanning = async (): Promise<void> => {
    if (isScanning) {
      console.log('Already scanning');
      return;
    }
    setData([]);
    setIsScanning(true);

    console.log('Starting scan...');
    await manager.startDeviceScan(
      null,
      {allowDuplicates: false},
      (error, device) => {
        if (error) {
          console.log('Scan error:', {error});
          stopScanning();
          return;
        }

        if (device) {
          setData(prevDevices => {
            if (!prevDevices.find(d => d.id === device.id)) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      },
    );
  };

  const connectToDevice = async (device: Device): Promise<void> => {
    try {
      if (isScanning) {
        stopScanning();
      }

      console.log(`Connecting to device: ${device.name || 'Unknown Device'}`);
      const connectedDevice = await manager.connectToDevice(device.id, {
        autoConnect: true,
      });
      await connectedDevice.discoverAllServicesAndCharacteristics();

      console.log(
        `Successfully connected to device: ${
          connectedDevice.name || 'Unknown Device'
        }`,
      );
      setConnectedDeviceItems(prevDevices => {
        if (!prevDevices.find(d => d.id === connectedDevice.id)) {
          return [...prevDevices, connectedDevice];
        }
        return prevDevices;
      });
    } catch (error) {
      console.error('Failed to connect to device:', error);
      setConnectedDeviceItems([]);
    }
  };

  const disconnectFromDevice = async (device: Device): Promise<void> => {
    try {
      await manager.cancelDeviceConnection(device.id);
      console.log('Disconnected from device:', device.name);
    } catch (error) {
      setConnectedDeviceItems(prev => prev.filter(d => d.id !== device.id));
      console.error('Failed to disconnect from device:', error);
    }
  };

  return {
    data,
    connectedDeviceItems,
    isScanning,
    requestPermissions,
    startScanning,
    stopScanning,
    connectToDevice,
    disconnectFromDevice,
    waitUntilBluetoothReady,
    bluetoothState,
    isBluetoothReady,
  };
};

export default useConnect;
