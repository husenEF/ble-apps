/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {
  Text,
  View,
  StatusBar,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  useColorScheme,
  Pressable,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import {Device} from 'react-native-ble-plx';

import useConnect from './src/service/useBleConnect';

const App = () => {
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
    isBluetoothReady,
    bluetoothState,
  } = useConnect();

  useEffect(() => {
    console.log({L50: bluetoothState});

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isBluetoothReady) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBluetoothReady]);

  useEffect(() => {
    console.log({L51: devices});
  }, [devices]);

  console.log({connectedDevice});

  const getDeviceName = (device: Device): string => {
    if (device.name !== null) {
      return device.name as string;
    } else if (device.localName !== null) {
      return device.localName as string;
    } else {
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
          {!isScanning && (
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
          {isScanning && (
            <Pressable style={styles.buttonStyle} onPress={stopScanning}>
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
            renderItem={({item}) => {
              item.localName !== null && console.log({item: item.localName});

              return (
                <View style={styles.device}>
                  <Text
                    style={{color: isDarkMode ? Colors.white : Colors.black}}>
                    {' '}
                    {getDeviceName(item)}
                  </Text>
                  {item.isConnectable &&
                    !connectedDevice.find(d => d.id === item.id) && (
                      <Pressable
                        style={styles.btnConnect}
                        onPress={() => connectToDevice(item)}>
                        <Text>Connect</Text>
                      </Pressable>
                    )}
                  {item.isConnectable &&
                    connectedDevice.find(d => d.id === item.id) && (
                      <Pressable
                        style={styles.btnConnect}
                        onPress={() => disconnectFromDevice(item)}>
                        <Text>Disconnect</Text>
                      </Pressable>
                    )}
                </View>
              );
            }}
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
