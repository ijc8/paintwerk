#define semitone 4.2

#define tonic 0
#define minor2nd (semitone*1)
#define major2nd (semitone*2)
#define minor3rd (semitone*3
#define major3rd (semitone*4)
#define fourth (semitone*5)
#define tritone (semitone*6)
#define fifth (semitone*7)
#define minor6th (semitone*8)
#define major6th (semitone*9)
#define minor7th (semitone*10)
#define major7th (semitone*11)
#define octave (semitone*12)

#define w 0
#define h 1
#define q 2
#define qt 3
#define e 4
#define et 5
#define sx 6
#define sxt 7
#define th 8
#define sxf 9

int notes[] = {0, 19, 32, 55, 32, 19};
int values[] = {e, e, e, e, e, e};
int vco_pin = 5;

void setup() {
  // put your setup code here, to run once:
  pinMode(vco_pin, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

int i = 0;
int bpm = 112;

float _q = 1.0f/bpm*60000; //BPM to milliseconds formula, gives us our quarter note value 

//calculate note durations based on BPM
float _w = 4*_q; //whole notes
float _h = _q*2; //half notes
float _qt = (_q/3)*2; //quarter note triplets
float _e = _q/2; // eighth notes
float _et = (_e/3)*2; // eigth note triplets
float _sx = _q/4; //sixteenth notes
float _sxt = (_sx/3)*2; //sixteenth note triplets
float _th = _q/8; //thrity-second notes
float _sxf = _q/16; //sixty-fourth notes

float _values[] = {_w, _h, _q, _qt, _e, _et, _sx, _sxt, _th, _sxf};

int base = 0;

void loop() {
  // put your main code here, to run repeatedly:
  if (Serial.available() > 0) {
    base = Serial.read();
  }
  analogWrite(vco_pin, base + notes[i]);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(10);
  digitalWrite(LED_BUILTIN, LOW);
  delay(_values[values[i]] - 10);
  i = (i + 1) % (sizeof(notes) / sizeof(int));
}
