// ═══════ SOUND ═══════
const SoundEngine=(()=>{let ctx=null;function gc(){if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();return ctx;}
function t(f,tp,s,d,g=.3){const c=gc(),o=c.createOscillator(),e=c.createGain();o.connect(e);e.connect(c.destination);o.type=tp;o.frequency.setValueAtTime(f,s);e.gain.setValueAtTime(0,s);e.gain.linearRampToValueAtTime(g,s+.01);e.gain.exponentialRampToValueAtTime(.001,s+d);o.start(s);o.stop(s+d+.05);}
return{workEnd(){const c=gc(),n=c.currentTime;t(523.25,'sine',n,.4,.25);t(659.25,'sine',n+.1,.4,.25);t(783.99,'sine',n+.2,.6,.25);t(1046.5,'sine',n+.35,.8,.2);},
breakEnd(){const c=gc(),n=c.currentTime;t(880,'square',n,.12,.15);t(880,'square',n+.18,.12,.15);t(1108,'sine',n+.4,.3,.2);},
start(){const c=gc(),n=c.currentTime;t(440,'sine',n,.15,.2);t(660,'sine',n+.15,.25,.2);}};})();
