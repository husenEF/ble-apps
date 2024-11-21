/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  NativeModules,
  useColorScheme,
  TouchableOpacity,
  NativeEventEmitter,
  PermissionsAndroid,
  Pressable,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import {Device} from 'react-native-ble-plx';

import BLEManagerClass from './src/service/BLEManager';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    width: '100%',
  };

  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    return () => {
      BLEManagerClass.stopScanning();
      BLEManagerClass.destroy();
    };
  }, []);

  const handleDeviceDiscovered = (device: Device) => {
    if (device.name) {
      console.log({device});
    }

    setDevices(prevDevices => {
      if (!prevDevices.find(d => d.id === device.id)) {
        return [...prevDevices, device];
      }
      return prevDevices;
    });
  };

  const handleError = (error: any) => {
    console.error('Error:', error);
  };
  const startScan = async () => {
    const permissionsGranted = await BLEManagerClass.requestPermissions();
    if (!permissionsGranted) {
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
    }

    setDevices([]);
    setScanning(true);
    BLEManagerClass.startScanning(handleDeviceDiscovered, handleError);
  };

  const connectToDevice = async (device: Device) => {
    console.log('Connecting to device:', device.name);
    BLEManagerClass.stopScanning();
    const connectedDeviceItem = await BLEManagerClass.connectToDevice(device);

    if (connectedDeviceItem) {
      console.log('Device connected:', connectedDevice);
      setConnectedDevice(connectedDeviceItem);
      // Proceed with communication (e.g., reading/writing characteristics)
    } else {
      console.log('Failed to connect to the device.');
      setConnectedDevice(null);
    }
  };

  const disconectFromDevice = () => {
    if (connectedDevice) {
      // BLEManagerClass.disconnectFromDevice(connectedDevice);
      setConnectedDevice(null);
    }
  };

  const stopScan = () => {
    BLEManagerClass.stopScanning();
    setScanning(false);
  };

  return (
    <SafeAreaView style={[backgroundStyle, styles.mainBody]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <ScrollView
        horizontal={true}
        style={backgroundStyle}
        contentContainerStyle={styles.mainBody}
        contentInsetAdjustmentBehavior="automatic">
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
            marginBottom: 40,
          }}>
          <View>
            <Text
              style={{
                fontSize: 30,
                textAlign: 'center',
                color: isDarkMode ? Colors.white : Colors.black,
              }}>
              React Native BLE Manager
            </Text>
          </View>
          {!scanning && (
            <Pressable style={styles.buttonStyle} onPress={startScan}>
              <Text
                style={{
                  ...styles.buttonTextStyle,
                  color: isDarkMode ? Colors.white : Colors.black,
                }}>
                Scan Bluetooth Devices{' '}
              </Text>
            </Pressable>
          )}
          {scanning && (
            <Pressable style={styles.buttonStyle} onPress={stopScan}>
              <Text
                style={{
                  ...styles.buttonTextStyle,
                  color: isDarkMode ? Colors.white : Colors.black,
                }}>
                Stop Scan
              </Text>
            </Pressable>
          )}
          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <View style={styles.device}>
                <Text>{item.name || 'Unknown Device'}</Text>
                {item.isConnectable && item.id !== connectedDevice?.id && (
                  <Pressable
                    style={styles.btnConnect}
                    onPress={() => connectToDevice(item)}>
                    <Text>Connect</Text>
                  </Pressable>
                )}
                {item.isConnectable && item.id === connectedDevice?.id && (
                  <Pressable
                    style={styles.btnConnect}
                    onPress={disconectFromDevice}>
                    <Text>Disconnect</Text>
                  </Pressable>
                )}
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const windowHeight = Dimensions.get('window').height;
const styles = StyleSheet.create({
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    height: windowHeight,
  },
  buttonStyle: {
    backgroundColor: '#307ecc',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#307ecc',
    height: 40,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 15,
  },
  buttonTextStyle: {
    color: '#FFFFFF',
    paddingVertical: 10,
    fontSize: 16,
  },
  device: {
    fontSize: 16,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnConnect: {
    backgroundColor: '#307ecc',
    borderWidth: 0,
    color: '#FFFFFF',
    padding: 4,
    borderRadius: 8,
  },
});
export default App;
