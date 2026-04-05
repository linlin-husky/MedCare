#include <SoftwareSerial.h>
#include <DHT.h>

// Wiring:
// ESP-01 TX -> Uno D2 (software RX)
// ESP-01 RX -> Uno D3 (software TX) with level shifter
// DHT22 DATA -> Uno D4
// ESP VCC -> stable 3.3V
// ESP GND -> Uno GND
// ESP EN/CH_PD -> 3.3V

#define ESP_RX_PIN 2
#define ESP_TX_PIN 3
SoftwareSerial espSerial(ESP_RX_PIN, ESP_TX_PIN);

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

const char* WIFI_SSID = "ARRIS-98A1";
const char* WIFI_PASSWORD = "056361559514";
const char* SERVER_HOST = "192.168.0.204";
const int SERVER_PORT = 3000;
const char* SERVER_PATH = "/api/device-signals/ingest";
const char* DEVICE_TOKEN = "medcare-device-token";
const char* TARGET_USERNAME = "peter";
const char* DEVICE_ID = "uno-esp01-dht22-01";

bool wifiConnected = false;

void sendAtCommand(const char* cmd, unsigned long timeout = 2000) {
  Serial.print("AT: ");
  Serial.println(cmd);
  espSerial.println(cmd);
  
  unsigned long start = millis();
  String response = "";
  while ((millis() - start) < timeout) {
    while (espSerial.available()) {
      char c = (char)espSerial.read();
      response += c;
      Serial.write(c);
    }
  }
  Serial.println();
}

String sendAtCommandWithResponse(const char* cmd, unsigned long timeout = 2000) {
  espSerial.println(cmd);
  
  unsigned long start = millis();
  String response = "";
  while ((millis() - start) < timeout) {
    while (espSerial.available()) {
      char c = (char)espSerial.read();
      response += c;
    }
  }
  return response;
}

bool initEsp() {
  Serial.println("Initializing ESP-01...");
  
  espSerial.begin(115200);
  delay(1500);
  
  // Flush any garbage from startup
  while (espSerial.available()) {
    espSerial.read();
  }
  
  // Try AT command repeatedly until we get a clean response
  for (int tries = 0; tries < 5; tries++) {
    delay(200);
    
    while (espSerial.available()) {
      espSerial.read();
    }
    
    espSerial.println("AT");
    delay(300);
    
    String resp = "";
    unsigned long start = millis();
    while ((millis() - start) < 800) {
      while (espSerial.available()) {
        char c = (char)espSerial.read();
        resp += c;
      }
    }
    
    if (resp.indexOf("OK") >= 0) {
      Serial.println("ESP-01 AT OK");
      
      // Set to Station mode (mode 1)
      delay(200);
      while (espSerial.available()) {
        espSerial.read();
      }
      espSerial.println("AT+CWMODE=1");
      delay(500);
      
      resp = "";
      start = millis();
      while ((millis() - start) < 1000) {
        while (espSerial.available()) {
          char c = (char)espSerial.read();
          resp += c;
        }
      }
      
      if (resp.indexOf("OK") >= 0 || resp.indexOf("no change") >= 0) {
        Serial.println("ESP-01 mode set to Station");
        return true;
      }
    }
  }
  
  Serial.println("ESP-01 not responding after retries");
  return false;
}

bool connectWifi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  // Clear any pending data
  while (espSerial.available()) {
    espSerial.read();
  }
  
  String atCmd = "AT+CWJAP=\"";
  atCmd += WIFI_SSID;
  atCmd += "\",\"";
  atCmd += WIFI_PASSWORD;
  atCmd += "\"";
  
  // Try connection up to 3 times
  for (int attempt = 0; attempt < 3; attempt++) {
    Serial.print("WiFi attempt ");
    Serial.println(attempt + 1);
    
    while (espSerial.available()) {
      espSerial.read();
    }
    
    espSerial.println(atCmd);
    delay(100);
    
    unsigned long start = millis();
    String resp = "";
    bool gotOk = false;
    
    while ((millis() - start) < 12000) {
      while (espSerial.available()) {
        char c = (char)espSerial.read();
        resp += c;
        if (c == '\n' || resp.length() > 200) {
          Serial.print("[RX] ");
          Serial.println(resp);
          
          if (resp.indexOf("OK") >= 0) {
            gotOk = true;
            break;
          }
          resp = "";
        }
      }
      if (gotOk) break;
    }
    
    // Check final status
    delay(500);
    while (espSerial.available()) {
      espSerial.read();
    }
    
    espSerial.println("AT+CWJAP?");
    delay(500);
    
    resp = "";
    start = millis();
    while ((millis() - start) < 2000) {
      while (espSerial.available()) {
        char c = (char)espSerial.read();
        resp += c;
      }
    }
    
    if (resp.indexOf(WIFI_SSID) >= 0 || resp.indexOf("CONNECTED") >= 0) {
      Serial.println("WiFi connected!");
      wifiConnected = true;
      return true;
    }
  }
  
  Serial.println("WiFi connection failed after retries");
  wifiConnected = false;
  return false;
}

bool postSensorData(float temp, float humidity) {
  if (!wifiConnected) {
    if (!connectWifi()) {
      return false;
    }
  }
  
  // Build JSON payload
  String payload = "{";
  payload += "\"username\":\"" + String(TARGET_USERNAME) + "\",";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"sensorType\":\"temperature\",";
  payload += "\"value\":" + String(temp, 1) + ",";
  payload += "\"unit\":\"C\",";
  payload += "\"battery\":75,";
  payload += "\"status\":\"ok\",";
  payload += "\"source\":\"arduino\"";
  payload += "}";
  
  // Connect to server
  String cipStart = "AT+CIPSTART=\"TCP\",\"";
  cipStart += SERVER_HOST;
  cipStart += "\",";
  cipStart += SERVER_PORT;
  
  sendAtCommand(cipStart.c_str(), 5000);
  delay(1000);
  
  // Prepare HTTP request with headers
  String httpRequest = "POST " + String(SERVER_PATH) + " HTTP/1.1\r\n";
  httpRequest += "Host: " + String(SERVER_HOST) + ":" + String(SERVER_PORT) + "\r\n";
  httpRequest += "Content-Type: application/json\r\n";
  httpRequest += "x-device-token: " + String(DEVICE_TOKEN) + "\r\n";
  httpRequest += "Content-Length: " + String(payload.length()) + "\r\n";
  httpRequest += "Connection: close\r\n\r\n";
  httpRequest += payload;
  
  // Send data length
  String cipSend = "AT+CIPSEND=";
  cipSend += httpRequest.length();
  
  sendAtCommand(cipSend.c_str(), 1000);
  delay(500);
  
  // Send actual data
  espSerial.print(httpRequest);
  delay(1000);
  
  // Read response
  String resp = "";
  unsigned long start = millis();
  while ((millis() - start) < 3000) {
    while (espSerial.available()) {
      char c = (char)espSerial.read();
      resp += c;
    }
  }
  
  // Check for 201 or 200
  bool success = (resp.indexOf("201") >= 0 || resp.indexOf("200") >= 0);
  Serial.print("HTTP Response: ");
  if (success) {
    Serial.println("201 Created");
  } else {
    Serial.println(resp.substring(0, 100));
  }
  
  // Close connection
  sendAtCommand("AT+CIPCLOSE", 2000);
  
  return success;
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("MedCare Sensor (Manual AT) - Starting");
  
  if (!initEsp()) {
    Serial.println("ESP-01 init failed. Halting.");
    while (true) {
      delay(1000);
    }
  }
  
  if (!connectWifi()) {
    Serial.println("WiFi connection failed. Will retry on sensor read.");
  }
  
  dht.begin();
  
  Serial.println("Setup complete. Reading sensors...");
}

void loop() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("DHT22 read failed, retrying in 10s...");
    delay(10000);
    return;
  }
  
  Serial.print("Temperature: ");
  Serial.print(temp);
  Serial.print("C, Humidity: ");
  Serial.print(humidity);
  Serial.println("%");
  
  // Post temperature
  if (postSensorData(temp, humidity)) {
    Serial.println("Temperature posted successfully");
  } else {
    Serial.println("Temperature post failed");
  }
  
  delay(10000);
}