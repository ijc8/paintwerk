int vca_pin = 3;
int vcf_pin = 5;
int vco_pin = 6;
int lfo_pin = 9;
byte bytes[4];

void setup() {
  pinMode(vca_pin, OUTPUT);
  pinMode(vcf_pin, OUTPUT);
  pinMode(vco_pin, OUTPUT);
  pinMode(lfo_pin, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  if (Serial.available() >= 4) {
    Serial.readBytes(bytes, 4);
    analogWrite(vca_pin, bytes[0]);
    analogWrite(vcf_pin, bytes[1]);
    analogWrite(vco_pin, bytes[2]);
    analogWrite(lfo_pin, bytes[3]);
    digitalWrite(LED_BUILTIN, 1);
  } else {
    digitalWrite(LED_BUILTIN, 0);
  }
}
