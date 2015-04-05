# Luggage tag

A simple project to record and visualize data in your (checked) luggage when traveling.

## Hardware

This project is made with a [Tessel](https://tessel.io/) (1), but could be done with lots of different hardware.

1. Tessel parts
    * Main [Tessel board](https://shop.tessel.io/Base%20Boards/Tessel)
    * [Accelerometer module](https://shop.tessel.io/Modules/Accelerometer%20Module)
    * [Climate module](https://shop.tessel.io/Modules/Climate%20Module)
    * [MicroSD module](https://shop.tessel.io/Modules/MicroSD%20Module)
1. MicroSD card
    * Most cards come with the FAT filesystem on it, but do make sure this is the case.
1. Power
    * (coming soon)

## Software

The following command line commands are meant to be run from this directory.

1. Plug in your Tessel to your computer via USB cable.
1. Install NodeJS (or assumingly io.js should work as well)
1. Install Tessel: `npm install tessel -g`
1. (optional) Update your Tessel to make sure the firmware is current: `npm update`
1. Install dependencies: `npm install`
1. (optional) Run the code on the Tessel once: `tessel run index.js`
1. Push code to the Tessel: `tessel push index.js`

### Utilities

* Output some of all the `luggage-tag-XXX` files from the SD card and output to the console.
    * `tessel run reader.js`
* Enable the Wifi since the main script disables it and it is kind of sticky.
    * `tessel run enable-wifi.js`
