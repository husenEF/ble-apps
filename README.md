# BLE App Manager

## Description
This App created for scanning Bluetooth Low Energy (BLE) devices

## How to use
Here is the flow of this App:
1. **Permission & Dashboard**  
    The application will request permission to use Bluetooth, and a popup will appear directing the user to the Bluetooth settings.

    ![Permission & Dashboard](images/step-1.png)

2. **Starting Scanning**  
    - The initial page will only have a button to initiate scanning.
    - Click the scan button to search for devices that meet BLE criteria.
    - Once clicked, the button's color and text will change, and information about the scanning process will be displayed below.
    - If the scan is enough, the stop button can be clicked at any time.

    ![Starting Scanning](images/step-2.png)

3. **Connecting to a Device**  
   If the scanning is successful:
    - A list of detected devices will appear.
    - Click the `Connect` button to connect to a device that supports direct pairing without a confirmation code.
    - A disconnect button will appear once the device is successfully connected.
    
    ![Connect & disconnect](images/step-3.png)



