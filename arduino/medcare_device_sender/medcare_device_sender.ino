#include <WiFi.h>
#include <HTTPClient.h>

// Install the "DHT sensor library" by Adafruit and "Adafruit Unified Sensor" in Arduino IDE.
#include <DHT.h>

// Step 1: update these values for your Wi-Fi and backend server.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://YOUR_RPI_OR_SERVER_IP:3000/api/device-signals/ingest";
const char* DEVICE_TOKEN = "medcare-device-token";

const char* TARGET_USERNAME = "admin";
const char* DEVICE_ID = "esp32-living-room-01";

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());
}

float readTemperatureC() {
  return dht.readTemperature();
}

float readHumidity() {
  return dht.readHumidity();
}

void postSignal(const char* sensorType, float value, const char* unit) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    connectWifi();
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);

  int battery = random(60, 100);

  String body = "{";
  body += "\"username\":\"" + String(TARGET_USERNAME) + "\",";
  body += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  body += "\"sensorType\":\"" + String(sensorType) + "\",";
  body += "\"value\":" + String(value, 1) + ",";
  body += "\"unit\":\"" + String(unit) + "\",";
  body += "\"battery\":" + String(battery) + ",";
  body += "\"status\":\"ok\",";
  body += "\"message\":\"temp-humidity signal sent from ESP32\",";
  body += "\"source\":\"arduino\"";
  body += "}";

  int code = http.POST(body);
  String response = http.getString();
  http.end();

  Serial.print("POST code: ");
  Serial.println(code);
  Serial.println(response);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  randomSeed(micros());
  dht.begin();
  connectWifi();
}

void loop() {
  float temperatureC = readTemperatureC();
  float humidity = readHumidity();

  if (isnan(temperatureC) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor.");
    delay(5000);
    return;
  }

  Serial.print("Sending Temperature (C): ");
  Serial.println(temperatureC);
  postSignal("temperature", temperatureC, "C");

  Serial.print("Sending Humidity (%): ");
  Serial.println(humidity);
  postSignal("humidity", humidity, "%");

  // Send every 10 seconds. Tune this for your real sensor frequency.
  delay(10000);
}