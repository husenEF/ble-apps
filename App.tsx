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
  };

  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      BLEManagerClass.stopScanning();
      BLEManagerClass.destroy();
    };
  }, []);

  const handleDeviceDiscovered = (device: Device) => {
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
      console.log(
        'Bluetooth permissions are required to scan for devices. Please enable them in your device settings.',
      );
      return;
    }

    setDevices([]);
    setScanning(true);
    BLEManagerClass.startScanning(handleDeviceDiscovered, handleError);
  };

  const stopScan = () => {
    BLEManagerClass.stopScanning();
    setScanning(false);
  };

  useEffect(() => {
    console.log({devices});
  }, [devices]);

  return (
    <SafeAreaView style={[backgroundStyle, styles.mainBody]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
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
              <Text style={styles.device}>
                {item.name || 'Unknown Device'} ({item.id})
              </Text>
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
  },
});
export default App;
