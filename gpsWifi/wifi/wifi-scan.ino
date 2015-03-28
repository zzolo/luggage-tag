//https://github.com/spark/warsting/tree/master/firmware

#include "wifiscan.h"
#undef min
#undef max
#include <vector>
#include <algorithm>

std::vector<String> scanned;   // The raw list of SSIDs from this scan (includes already seen networks)
// This is used to know when the scan has "looped" around when the SSID has already been scanned previously

/**
 * Set up the pins and change interrupts.
 */
void setup() {    
    Serial.begin(9600);
    WiFi.on();   // WiFi must be on so we can scan available networks
}

/**
 * Fetch the SSID as a string from the scan result. The SSID is not null terminated
 * in the result, and so is not readily usable as a string.
 * @param result  The scan result to fetch the SSID of.
 * @return The SSID as a String
 */
String ssid(WifiScanResults_t& result) {
    char buf[33];
    memcpy(buf, result.ssid, 32);
    buf[result.ssidlen] = 0;
    return buf;
}

/**
 * Determines if a vector contains a string.
 * @param v     The vector to check
 * @param value The value to look for
 * @return {@code true} if the string was found in the vector.
 */
bool contains(std::vector<String>& v, String& value) {
    return std::find(v.begin(), v.end(), value)!=v.end();
}

bool is_scanned(String& name) {
    bool result = contains(scanned, name);
    if (!result)
        scanned.push_back(name);
    return result;
}

bool start_scan = true;                 // when set to true, scan() will start a new scan if not already scanning)

/**
 * Start or continue an existing WiFi scan.
 */
void scan() {
    static bool scanning = false;
    static WifiScan scanner;    
    if (!scanning && start_scan) {
        scanning = true;
        start_scan = false;
        scanned.clear();
        scanner.startScan();
    }
    else {
        if (scanning) {
            WifiScanResults_t result;
            scanning = scanner.next(result);
            String name = ssid(result);        
            if (scanning && name.length() && is_scanned(name)) {
                // already seen this name, so stop scanning
                scanning = false;
            }
            else {
                Serial.println(ssid(result) + "," + result.security + "," + result.rssi);
            }
        }
    }
}

void loop() {
    static int lastScan = 0;    
    if ((millis()-lastScan)>30000 || start_scan ) {  // scan every 30s or if requested
        start_scan = true;
        lastScan = millis();
    }
    scan();   // start or continue scan
}
    