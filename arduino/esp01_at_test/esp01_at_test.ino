#include <SoftwareSerial.h>

// Wiring for this test:
// ESP-01 TX -> Uno D2
// ESP-01 RX <- Uno D3 (through level shifter / resistor divider)
// ESP VCC -> stable 3.3V
// ESP GND -> Uno GND
// ESP EN/CH_PD -> 3.3V

#define ESP_RX_PIN 2
#define ESP_TX_PIN 3
SoftwareSerial espSerial(ESP_RX_PIN, ESP_TX_PIN);

const long BAUDS[] = {9600, 19200, 38400, 57600, 115200};

bool probeBaud(long baud) {
  espSerial.end();
  delay(200);
  espSerial.begin(baud);
  delay(200);

  while (espSerial.available()) {
    espSerial.read();
  }

  espSerial.println("AT");

  unsigned long start = millis();
  String response = "";
  while ((millis() - start) < 1500) {
    while (espSerial.available()) {
      char c = (char)espSerial.read();
      response += c;
    }
  }

  response.trim();
  if (response.length() > 0) {
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.println("Response: <none>");
  }

  return response.indexOf("OK") >= 0 || response.indexOf("ready") >= 0;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("ESP-01 AT diagnostic start");

  bool found = false;
  for (unsigned int i = 0; i < sizeof(BAUDS) / sizeof(BAUDS[0]); i++) {
    long baud = BAUDS[i];
    Serial.print("Trying baud ");
    Serial.println(baud);

    if (probeBaud(baud)) {
      Serial.print("Detected AT firmware at baud ");
      Serial.println(baud);
      found = true;
      break;
    }
  }

  if (!found) {
    Serial.println("No AT response. Check wiring, level shifting, EN/CH_PD, power, or firmware.");
  }

  Serial.println("Type commands in Serial Monitor and they will be forwarded to ESP-01.");
}

void loop() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    espSerial.write(c);
  }

  while (espSerial.available()) {
    char c = (char)espSerial.read();
    Serial.write(c);
  }
}
