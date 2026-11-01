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

run('-i', ROOT/'provider-original-38s.mp3', '-ar', '48000', '-ac', '2', ROOT/'provider-decoded.wav')
with wave.open(str(ROOT/'provider-decoded.wav')) as source:
    rate, channels, width = source.getframerate(), source.getnchannels(), source.getsampwidth()
    original_frames = source.getnframes()
    data = source.readframes(original_frames)
frame_bytes = channels * width
assert original_frames >= 38*rate
cut = 24*rate*frame_bytes
final = data[:cut] + bytes(2*rate*frame_bytes) + data[cut:38*rate*frame_bytes]
assert len(final) == 40*rate*frame_bytes
with wave.open(str(ROOT/'RudyLadit-maquette-40s-v1.wav'), 'wb') as output:
    output.setparams((channels,width,rate,0,'NONE','not compressed'))
    output.writeframes(final)
run('-i',ROOT/'RudyLadit-maquette-40s-v1.wav','-c:a','libmp3lame','-b:a','192k',ROOT/'RudyLadit-maquette-40s-v1.mp3')
run('-i',ROOT/'RudyLadit-maquette-40s-v1.mp3',ROOT/'final-decoded.wav')
with wave.open(str(ROOT/'final-decoded.wav')) as decoded:
    frames = decoded.getnframes()
    assert frames/decoded.getframerate()==40
    decoded.setpos(int(24.05*rate))
    silent=decoded.readframes(int(1.9*rate))
samples=struct.unpack('<'+str(len(silent)//2)+'h',silent)
peak=max(abs(v) for v in samples)
assert peak==0, peak
mp3=(ROOT/'RudyLadit-maquette-40s-v1.mp3').read_bytes()
result={
    'final_duration_seconds':40,'sample_rate_hz':rate,'channels':channels,
    'decoded_frames':frames,'mp3_bytes':len(mp3),'sha256':hashlib.sha256(mp3).hexdigest(),
    'provider_duration_seconds':original_frames/rate,
    'silence_seconds':[24,26],'silence_core_peak_pcm':peak,
    'provider_calls':1,'temporary_access_revoked':True,
    'timing':[{'start':0,'end':8,'music':'Upper-register expressive piano; arpeggio pickup'},
              {'start':8,'end':16,'music':'Piano continues; violins join'},
              {'start':16,'end':20,'music':'Piano and violins continue; cello joins'},
              {'start':20,'end':24,'music':'All continue; pizzicato double bass joins'},
              {'start':24,'end':26,'music':'Full silence'},
              {'start':26,'end':31,'music':'Acoustic drum kit alone'},
              {'start':31,'end':40,'music':'All return; foreground electric guitar riff'}],
    'quality_note':'Timing, silence and decodability verified; musical arrangement requires listening review.'
}
(ROOT/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
