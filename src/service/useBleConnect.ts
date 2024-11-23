import {useEffect, useState} from 'react';
import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

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
  const [subscription, setSubscription] = useState<any>();

  useEffect(() => {
    const subscriptionData = manager.onStateChange(state => {
      console.log(`Bluetooth state changed: ${state}`);
      setBluetoothState(state);

      if (state === 'PoweredOn') {
        setIsBluetoothReady(true);
      } else {
        setIsBluetoothReady(false);
        Alert.alert(
          'Bluetooth not ready',
          'Pleases enable Bluetooth in your device settings.',
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
    }, true); // Check the current state immediately.
    setSubscription(subscriptionData);
  }, [manager]);

  useEffect(() => {
    return () => {
      console.log('Cleaning up BLE manager...');
      subscription && subscription.remove();
      manager.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const subscriptionState = manager.onStateChange(state => {
        console.log(`Bluetooth state: ${state}`);
        if (state === 'PoweredOn') {
          subscription.remove(); // Remove the listener once the state is "PoweredOn"
          resolve(true);
        } else if (
          state === 'Unauthorized' ||
          state === 'Unsupported' ||
          state === 'PoweredOff'
        ) {
          subscriptionState.remove();
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
        {connectedDevice},
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
      const isConnected = await manager.isDeviceConnected(device.id);
      if (!isConnected) {
        console.log(`Device ${device.id} is not connected.`);
        return;
      }

      await manager.cancelDeviceConnection(device.id);
      console.log(`Successfully disconnected from device ${device.id}.`);
    } catch (error) {
      console.error(`Failed to disconnect from device ${device.id}:`, error);
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
