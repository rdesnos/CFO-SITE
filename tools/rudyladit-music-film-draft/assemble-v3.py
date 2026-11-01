import hashlib
import json
import pathlib
import struct
import subprocess
import sys
import wave

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / '.pilot-tools'))
import imageio_ffmpeg
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

def run(*args):
    subprocess.run([ffmpeg, '-v', 'error', '-y', *map(str,args)], check=True)

run('-i', ROOT/'provider-original-40s.mp3', '-ar', '48000', '-ac', '2', ROOT/'provider-decoded.wav')
with wave.open(str(ROOT/'provider-decoded.wav')) as source:
    rate, channels, width = source.getframerate(), source.getnchannels(), source.getsampwidth()
    original_frames = source.getnframes()
    data = source.readframes(original_frames)
frame_bytes = channels * width
assert original_frames >= 40*rate

def write_wav(name, pcm):
    with wave.open(str(ROOT/name), 'wb') as output:
        output.setparams((channels,width,rate,0,'NONE','not compressed'))
        output.writeframes(pcm)

# The provider's minimum chunk length is 3 seconds. Preserve the entire solo,
# including its pickup into the finale, while fitting it to 30.5–33 seconds.
write_wav('drums-3s.wav', data[30*rate*frame_bytes:33*rate*frame_bytes])
run('-i',ROOT/'drums-3s.wav','-af','rubberband=tempo=1.2,apad,atrim=duration=2.5',ROOT/'drums-2p5s.wav')
with wave.open(str(ROOT/'drums-2p5s.wav')) as drum_file:
    drum_data=drum_file.readframes(drum_file.getnframes())
assert len(drum_data)==int(2.5*rate)*frame_bytes
final = data[:30*rate*frame_bytes] + bytes(int(0.5*rate)*frame_bytes) + drum_data + data[33*rate*frame_bytes:40*rate*frame_bytes]
assert len(final)==40*rate*frame_bytes
write_wav('RudyLadit-maquette-40s-v3.wav',final)
run('-i',ROOT/'RudyLadit-maquette-40s-v3.wav','-c:a','libmp3lame','-b:a','192k',ROOT/'RudyLadit-maquette-40s-v3.mp3')
run('-i',ROOT/'RudyLadit-maquette-40s-v3.mp3',ROOT/'final-decoded.wav')
with wave.open(str(ROOT/'final-decoded.wav')) as decoded:
    frames=decoded.getnframes()
    assert frames/decoded.getframerate()==40
    decoded.setpos(int(30.05*rate))
    silence=decoded.readframes(int(0.4*rate))
peak=max(abs(v) for v in struct.unpack('<'+str(len(silence)//2)+'h',silence))
assert peak==0, peak
mp3=(ROOT/'RudyLadit-maquette-40s-v3.mp3').read_bytes()
result={'version':3,'date':'2026-11-01','final_duration_seconds':40,
    'sample_rate_hz':rate,'channels':channels,'decoded_frames':frames,
    'mp3_bytes':len(mp3),'sha256':hashlib.sha256(mp3).hexdigest(),
    'provider_duration_seconds':original_frames/rate,
    'silence_seconds':[30,30.5],'silence_core_peak_pcm':peak,'provider_calls':1,
    'drum_processing':'Pitch-preserving time compression of provider 3s solo to 2.5s, tempo factor 1.2',
    'requested_timing':[{'start':0,'end':8,'music':'High lyrical acoustic piano, arpeggio pickup'},
        {'start':8,'end':16,'music':'Violins join and swell; piano continues'},
        {'start':16,'end':24,'music':'Cello joins and swells; earlier instruments continue'},
        {'start':24,'end':30,'music':'Pizzicato double bass joins; all earlier layers continue'},
        {'start':30,'end':30.5,'music':'Full silence'},
        {'start':30.5,'end':33,'music':'Acoustic drum kit alone'},
        {'start':33,'end':40,'music':'Full ensemble return with foreground electric guitar riff'}],
    'artistic_direction':'Warm intimate melodic French pop; original instrumental composition',
    'quality_note':'Duration, decodability and exact silence verified; instrument identity and artistic fidelity require listening review.'}
(ROOT/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
