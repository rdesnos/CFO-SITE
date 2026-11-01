import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import wave

R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'.pilot-tools'))
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();RATE=48000
def run(*args):subprocess.run([FF,'-v','error','-y',*map(str,args)],check=True)
def read(p):
    with wave.open(str(p)) as w:
        assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(2,2,RATE)
        return w.readframes(w.getnframes())
def rms(b):
    a=array.array('h',b);return math.sqrt(sum(x*x for x in a)/max(1,len(a)))
def decode(name):
    p=R/(Path(name).stem+'-decoded.wav');run('-i',R/name,'-ar',RATE,'-ac',2,p);return read(p)
def active(b,threshold=100):
    levels=[rms(b[i*480*4:(i+1)*480*4]) for i in range(len(b)//(480*4))]
    return next(i for i,v in enumerate(levels) if v>threshold)*.01,(max(i for i,v in enumerate(levels) if v>threshold)+1)*.01
def section(path,start,stop,target,label):
    out=R/(label+'.wav')
    run('-i',path,'-af',f'atrim=start={start}:end={stop},asetpts=PTS-STARTPTS,rubberband=tempo={(stop-start)/target},apad,atrim=duration={target}','-ar',RATE,'-ac',2,out)
    b=read(out);assert len(b)==round(target*RATE)*4;return b

first=decode('first-original.mp3')
start,end=active(first)
assert start<4 and end>24,'First phrase has too little usable audio'
firstparts=[section(R/'first-original.mp3',start,5,5,'piano-opening'),section(R/'first-original.mp3',5,9,4,'violin-entry'),section(R/'first-original.mp3',9,end,19.7,'strings-development')]
first=b''.join(firstparts)
drums=read(R.parent/'eleven-music-score08/drums-original-6s-decoded.wav')[:4*RATE*4]
assert rms(drums[:int(.1*RATE)*4])>100
assert min(rms(drums[i*12000*4:(i+1)*12000*4]) for i in range(16))>100
finale=decode('finale-original.mp3')
fs,fe=active(finale)
assert fe-fs>=5,'Finale has too little usable audio'
finale=section(R/'finale-original.mp3',fs,fe,7,'electric-finale')
final=first+bytes(round(.3*RATE)*4)+drums+finale
assert len(final)==40*RATE*4
levels=[rms(final[i*480*4:(i+1)*480*4]) for i in range(4000)]
lo,hi=2870,2900
while lo>0 and levels[lo-1]<60:lo-=1
while hi<4000 and levels[hi]<60:hi+=1
assert (hi-lo)*.01<=.35,'Extended silence around breath'
wav=R/'RudyLadit-proposition-40s-v11.wav'
with wave.open(str(wav),'wb') as w:
    w.setparams((2,2,RATE,0,'NONE','not compressed'));w.writeframes(final)
mp3=R/'RudyLadit-proposition-40s-v11.mp3'
run('-i',wav,'-c:a','libmp3lame','-b:a','192k',mp3)
decoded=decode(mp3.name);assert len(decoded)==len(final)
validation={'duration_seconds':40,'breath_seconds':.3,'effective_near_silent_bounds_seconds':[lo*.01,hi*.01],'drums_solo_seconds':[29,33],'electric_finale_seconds':[33,40],'first_source_active_bounds_seconds':[start,end],'finale_source_active_bounds_seconds':[fs,fe],'provider_generations_this_version':2,'reused':'V8 drum solo, first 4 seconds','review':'Listening proposal for user judgment. Durations and signal energy verified. Instrument identity, melody, harmonic fit and resemblance to references not independently certified.','arrangement_proposal':'Piano 0-5; violin requested at 5; pizzicato cello requested at 9; phrase develops to 28.7; breath 28.7-29; drums 29-33; full electric finale 33-40. New 40-second proposal extends the earlier 27.3-second structure.','sha256':hashlib.sha256(mp3.read_bytes()).hexdigest()}
(R/'validation.json').write_text(json.dumps(validation,indent=2),encoding='utf-8')
print(json.dumps(validation))
