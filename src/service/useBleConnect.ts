import {useEffect, useState} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import {BleManager, type Device} from 'react-native-ble-plx';

interface PropConnect {
  data: Device[];
  connectedDeviceItems: Device[];
  isScanning: boolean;
  requestPermissions: () => Promise<boolean>;
  startScanning: () => void;
  stopScanning: () => void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectFromDevice: (device: Device) => Promise<void>;
}

const useConnect = (): PropConnect => {
  const [manager] = useState<BleManager>(new BleManager());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [data, setData] = useState<Device[]>([]);
  const [connectedDeviceItems, setConnectedDeviceItems] = useState<Device[]>(
    [],
  );

  useEffect(() => {
    return () => {
      console.log('Cleaning up BLE manager...');
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
        console.log({error});

        // if (error) {
        //   console.log('Scan error:', error);
        //   stopScanning();
        //   return;
        // }

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
      const connectedDevice = await manager.connectToDevice(device.id);
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
  };
};

export default useConnect;
