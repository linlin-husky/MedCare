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
// const char* SERVER_HOST = "192.168.0.204"; //Pi IP
const char* SERVER_HOST = "192.168.0.213";//Mac IP
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
  while ((millis() - start) < timeout) {
    while (espSerial.available()) {
      char c = (char)espSerial.read();
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
  const long bootBauds[] = {9600, 115200};

  for (unsigned int baudIndex = 0; baudIndex < sizeof(bootBauds) / sizeof(bootBauds[0]); baudIndex++) {
    long bootBaud = bootBauds[baudIndex];
    espSerial.end();
    delay(200);
    espSerial.begin(bootBaud);
    delay(2500);

    // Flush any garbage from startup.
    while (espSerial.available()) {
      espSerial.read();
    }

    // Try AT command repeatedly until we get a clean response.
    for (int tries = 0; tries < 8; tries++) {
      delay(300);

      while (espSerial.available()) {
        espSerial.read();
      }

      espSerial.println("AT");
      delay(400);

      String resp = "";
      unsigned long start = millis();
      while ((millis() - start) < 1500) {
        while (espSerial.available()) {
          char c = (char)espSerial.read();
          resp += c;
        }
      }

      if (resp.indexOf("OK") >= 0) {
        Serial.print("ESP-01 AT OK at ");
        Serial.println(bootBaud);

        // If module currently runs at 115200, move it to 9600 for SoftwareSerial stability.
        if (bootBaud == 115200) {
          while (espSerial.available()) {
            espSerial.read();
          }
          espSerial.println("AT+UART_DEF=9600,8,1,0,0");
          delay(1000);
          espSerial.end();
          delay(200);
          espSerial.begin(9600);
          delay(500);
        }

        // Set to Station mode (mode 1)
        while (espSerial.available()) {
          espSerial.read();
        }
        espSerial.println("AT+CWMODE=1");
        delay(700);

        resp = "";
        start = millis();
        while ((millis() - start) < 1500) {
          while (espSerial.available()) {
            char c = (char)espSerial.read();
            resp += c;
          }
        }

        if (resp.indexOf("OK") >= 0 || resp.indexOf("no change") >= 0) {
          Serial.println("ESP-01 mode set to Station");

            // Disable command echo to reduce serial traffic and RAM churn on Uno.
            while (espSerial.available()) {
              espSerial.read();
            }
            espSerial.println("ATE0");
            delay(400);
            while (espSerial.available()) {
              espSerial.read();
            }
          return true;
        }
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

  // Build a compact JSON payload with fixed buffers to avoid String fragmentation on Uno.
  char tempValue[16];
  dtostrf(temp, 0, 1, tempValue);
  while (tempValue[0] == ' ') {
    memmove(tempValue, tempValue + 1, strlen(tempValue));
  }

  char payload[140];
  int payloadLen = snprintf(
    payload,
    sizeof(payload),
    "{\"username\":\"%s\",\"deviceId\":\"%s\",\"sensorType\":\"temperature\",\"value\":%s,\"unit\":\"C\"}",
    TARGET_USERNAME,
    DEVICE_ID,
    tempValue
  );

  if (payloadLen <= 0 || payloadLen >= (int)sizeof(payload)) {
    Serial.println("Payload build failed.");
    return false;
  }
  
  // Connect to server (fixed buffer avoids String heap fragmentation on Uno).
  char cipStart[96];
  int cipStartLen = snprintf(
    cipStart,
    sizeof(cipStart),
    "AT+CIPSTART=\"TCP\",\"%s\",%d",
    SERVER_HOST,
    SERVER_PORT
  );
  if (cipStartLen <= 0 || cipStartLen >= (int)sizeof(cipStart)) {
    Serial.println("CIPSTART build failed.");
    return false;
  }

  sendAtCommand(cipStart, 5000);
  delay(1000);
  
  // Prepare HTTP request with fixed buffer and exact byte count.
  char httpRequest[300];
  int reqLen = snprintf(
    httpRequest,
    sizeof(httpRequest),
    "POST %s HTTP/1.1\r\n"
    "Host: %s:%d\r\n"
    "Content-Type: application/json\r\n"
    "x-device-token: %s\r\n"
    "Content-Length: %d\r\n"
    "Connection: close\r\n\r\n"
    "%s",
    SERVER_PATH,
    SERVER_HOST,
    SERVER_PORT,
    DEVICE_TOKEN,
    payloadLen,
    payload
  );

  if (reqLen <= 0 || reqLen >= (int)sizeof(httpRequest)) {
    Serial.println("Request build failed.");
    return false;
  }

  Serial.print("Request length: ");
  Serial.println(reqLen);
  
  // Send data length
  char cipSend[32];
  int cipSendLen = snprintf(cipSend, sizeof(cipSend), "AT+CIPSEND=%d", reqLen);
  if (cipSendLen <= 0 || cipSendLen >= (int)sizeof(cipSend)) {
    Serial.println("CIPSEND build failed.");
    return false;
  }

  String sendResp = sendAtCommandWithResponse(cipSend, 3000);
  Serial.print("CIPSEND reply: ");
  Serial.println(sendResp);
  if (sendResp.indexOf(">") < 0) {
    Serial.println("Did not receive CIPSEND prompt.");
    return false;
  }
  delay(200);
  
  // Send actual data
  espSerial.write((const uint8_t*)httpRequest, reqLen);
  espSerial.flush();
  delay(200);
  
  // Read response with bounded memory usage (Uno has limited SRAM).
  char respSnippet[128];
  int snippetLen = 0;
  bool saw200 = false;
  bool saw201 = false;
  unsigned long totalBytes = 0;
  unsigned long start = millis();
  while ((millis() - start) < 8000) {
    while (espSerial.available()) {
      char c = (char)espSerial.read();
      totalBytes++;
      Serial.write(c);

      if (snippetLen < (int)sizeof(respSnippet) - 1) {
        respSnippet[snippetLen++] = c;
      }
    }
  }
  respSnippet[snippetLen] = '\0';
  Serial.println();
  Serial.print("Raw HTTP resp length: ");
  Serial.println(totalBytes);

  if (strstr(respSnippet, " 200 ") != NULL || strstr(respSnippet, "HTTP/1.1 200") != NULL) {
    saw200 = true;
  }
  if (strstr(respSnippet, " 201 ") != NULL || strstr(respSnippet, "HTTP/1.1 201") != NULL) {
    saw201 = true;
  }

  // Check for 201 or 200
  bool success = saw200 || saw201;
  Serial.print("HTTP Response: ");
  if (success) {
    Serial.println("201 Created");
  } else {
    Serial.println(respSnippet);
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