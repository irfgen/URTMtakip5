# ESP32 CNC Monitor

This project is designed to monitor the status of a CNC machine using an ESP32 microcontroller. It connects to a specified Wi-Fi network and sends updates regarding the CNC's operational state to a main system.

## Project Structure

```
esp32-cnc-monitor
├── src
│   └── main.cpp            # Main entry point for the ESP32 application
├── include
│   ├── config.h           # Configuration constants (Wi-Fi credentials, CNC status codes)
│   ├── wifi_manager.h      # Functions for managing Wi-Fi connections
│   └── cnc_monitor.h       # Functions for monitoring CNC status
├── lib
│   └── README.md           # Documentation for any external libraries used
├── test
│   └── README.md           # Documentation for testing strategy and test cases
├── platformio.ini          # PlatformIO configuration file
└── README.md               # Project documentation
```

## Features

- **Wi-Fi Connectivity**: Connects to a specified Wi-Fi network and handles reconnections if the connection is lost.
- **CNC Monitoring**: Monitors the CNC machine's operational state and sends updates based on its status.
- **Efficient Messaging**: Only sends messages when the CNC state changes, reducing unnecessary network traffic.

## Setup Instructions

1. Clone the repository to your local machine.
2. Open the project in your preferred IDE.
3. Update the `config.h` file with your Wi-Fi credentials and server address.
4. Build and upload the code to your ESP32 using PlatformIO.
5. Monitor the serial output for connection status and CNC updates.

## Usage

Once the ESP32 is connected to the Wi-Fi network, it will start monitoring the CNC machine. The CNC's operational state will be sent to the main system whenever there is a change in status (0, 1, or 2).

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.