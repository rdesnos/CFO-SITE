import hashlib
import json
import math
import pathlib
import struct
import subprocess
import sys
import wave

ROOT=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'.pilot-tools'))
import imageio_ffmpeg
path=ROOT/'RudyLadit-premiere-phrase-v5.mp3'
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-i',str(path),'-ar','48000','-ac','2',str(ROOT/'decoded-check.wav')],check=True)
with wave.open(str(ROOT/'decoded-check.wav')) as w:
    rate,frames=w.getframerate(),w.getnframes()
    pcm=struct.unpack('<'+str(frames*2)+'h',w.readframes(frames))
def rms(a,b):
    samples=pcm[int(a*rate)*2:int(b*rate)*2]
    return math.sqrt(sum(v*v for v in samples)/max(1,len(samples)))
windows=[{'start_seconds':t,'rms_pcm':rms(t,t+.25)} for t in [27,28,28.5,29,29.25,29.5,29.75]]
ref=rms(20,27)
tail=rms(29.75,30)
audio=path.read_bytes()
result={'version':5,'stage':'first_phrase_only','requested_duration_seconds':30,
    'decoded_duration_seconds':frames/rate,'sample_rate_hz':rate,'channels':2,
    'mp3_bytes':len(audio),'sha256':hashlib.sha256(audio).hexdigest(),
    'provider_calls':1,'post_processing':'None. Original provider MP3 delivered byte-for-byte; no trimming, fade, inserted silence or concatenation.',
    'tail_energy_windows':windows,'tail_to_body_ratio':tail/ref if ref else None,
    'low_energy_tail_detected':tail<ref*.1,
    'planned_final_timeline':{'first_phrase':[0,30],'silence':[30,31],'drums_only':[31,33],'electric_riff_and_ensemble':[33,40]},
    'review':'Full decode verified. Musical cadence and naturalness require listening approval before producing the second phrase.'}
(ROOT/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
