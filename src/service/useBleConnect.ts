import {useEffect, useState} from 'react';
import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

interface BleState {
  data: Device[];
  connectedDeviceItems: Device[];
  isScanning: boolean;
  bluetoothState: string | null;
  isBluetoothReady: boolean;
}

interface BleActions {
  requestPermissions: () => Promise<boolean>;
  startScanning: () => void;
  stopScanning: () => void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectFromDevice: (device: Device) => Promise<void>;
  waitUntilBluetoothReady: () => Promise<boolean>;
}

interface PropConnect extends BleState, BleActions {}

/**
 * useConnect is a React Hook that provides an interface to connect to nearby Bluetooth Low Energy (BLE) devices using the react-native-ble-plx library.
 *
 * The hook returns an object with the following properties:
 *
 * - `data`: An array of Device objects representing the devices that are currently scanning.
 * - `connectedDeviceItems`: An array of Device objects representing the devices that are currently connected.
 * - `isScanning`: A boolean indicating whether the device is currently scanning for BLE devices.
 * - `requestPermissions`: A function that requests the necessary permissions to use BLE on the device.
 * - `startScanning`: A function that starts scanning for BLE devices.
 * - `stopScanning`: A function that stops scanning for BLE devices.
 * - `connectToDevice`: A function that connects to a specific BLE device.
 * - `disconnectFromDevice`: A function that disconnects from a specific BLE device.
 * - `waitUntilBluetoothReady`: A function that waits until the device's Bluetooth adapter is ready.
 * - `bluetoothState`: A string indicating the current state of the device's Bluetooth adapter.
 * - `isBluetoothReady`: A boolean indicating whether the device's Bluetooth adapter is ready.
 *
 * The hook also handles the following side effects:
 *
 * - Requests the necessary permissions to use BLE on the device when the component mounts.
 * - Starts scanning for BLE devices when the component mounts.
 * - Stops scanning for BLE devices when the component unmounts.
 * - Updates the `data` and `connectedDeviceItems` arrays when the device state changes.
 */
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
    getAllDeviceConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  useEffect(() => {
    return () => {
      console.log('Cleaning up BLE manager...');
      subscription && subscription.remove();
      manager.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Request the necessary permissions to use BLE on Android.
   * On Android 12 and above, it requests BLUETOOTH_SCAN and BLUETOOTH_CONNECT.
   * On Android 11 and below, it requests ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION.
   * On iOS, it simply returns true.
   * @return {boolean} true if all the necessary permissions are granted.
   */
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

  /**
   * @name stopScanning
   * @returns {void}
   * @description
   * Stops the BLE device scan.
   * If the device scan is not active, it does nothing.
   * It also sets the isScanning state to false.
   */
  const stopScanning = () => {
    if (!isScanning) {
      console.log('Not scanning');
      return;
    }
    console.log('Stopping scan...');
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  /**
   * @name waitUntilBluetoothReady
   * @description
   * Waits until the Bluetooth adapter is ready by monitoring its state.
   * This function returns a Promise that resolves to true when the Bluetooth
   * state becomes "PoweredOn". If the Bluetooth state changes to "Unauthorized",
   * "Unsupported", or "PoweredOff", the Promise is rejected with an error.
   *
   * @returns {Promise<boolean>} A promise that resolves to true when Bluetooth is ready,
   * or rejects with an error if the state is not suitable.
   */
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

/**
 * @name startScanning
 * @description
 * Initiates the scanning process for BLE devices. If a scan is already in progress,
 * the function logs a message and returns early. Otherwise, it starts a new scan,
 * resets the current device data, and updates the scanning state.
 *
 * During scanning, discovered devices are added to the data state if they haven't been
 * previously encountered. If an error occurs during scanning, the scanning process is stopped.
 *
 * @returns {Promise<void>} A promise that resolves when the scanning process is successfully initiated.
 */
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

  /**
   * @name connectToDevice
   * @description
   * Connects to a BLE device. Stops scan if in progress. Logs errors
   * and connected devices.
   *
   * @param {Device} device The BLE device to connect to.
   * @returns {Promise<void>} A promise that resolves when the device is
   * successfully connected.
   */
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
    } finally {
      const connectedDevices = await getAllDeviceConnected();
      console.log({connectedDevices});
    }
  };

  /**
   * @name disconnectFromDevice
   * @description Disconnects from a connected BLE device. Logs errors and disconnected
   * devices.
   *
   * @param {Device} device The BLE device to disconnect from.
   * @returns {Promise<void>} A promise that resolves when the device is
   * successfully disconnected.
   */
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

  /**
   * @name getAllDeviceConnected
   * @description Fetches all BLE devices that are currently connected to the device.
   * If serviceUUIDs are provided, only devices connected to those services are returned.
   *
   * @param {string[]} [serviceUUIDs=[]] The UUIDs of services whose connected devices to fetch.
   * @returns {Promise<Device[]>} A promise that resolves to an array of connected BLE devices.
   * @todo double check for this method
   */
  const getAllDeviceConnected = async (
    serviceUUIDs: string[] = [],
  ): Promise<Device[]> => {
    try {
      // Fetch connected devices for the specified service UUIDs
      const connectedDevices = await manager.connectedDevices(serviceUUIDs);
      console.log('Connected devices:', connectedDevices);
      return connectedDevices;
    } catch (error) {
      console.error('Failed to fetch connected devices:', error);
      return [];
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
