int vco_pin = 5;
int gate_pin = LED_BUILTIN;

void setup() {
  pinMode(vco_pin, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  if (Serial.available() > 1) {
    byte vco = Serial.read();
    byte gate = Serial.read();
    analogWrite(vco_pin, vco);
    digitalWrite(gate_pin, gate);
  }
  digitalWrite(gate_pin, LOW);
}
