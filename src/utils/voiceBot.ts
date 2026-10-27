/**
 * Voice Bot & Ringtone Simulator for automated OPD call alerts.
 * Uses Web Audio API for telephone ring sound and SpeechSynthesis API for Hindi/Indian voice.
 */

class VoiceBotService {
  private audioCtx: AudioContext | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a simulated phone incoming ring chime (dual-tone multi-frequency).
   */
  public playPhoneRing(durationMs = 2500): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Standard Indian telephone ring tones: 400Hz + 450Hz
        osc1.frequency.setValueAtTime(400, ctx.currentTime);
        osc2.frequency.setValueAtTime(450, ctx.currentTime);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        // Beep burst rhythm
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0, ctx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0, ctx.currentTime + 1.9);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
            osc1.disconnect();
            osc2.disconnect();
          } catch {
            // ignore
          }
          resolve();
        }, durationMs);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Speaks the automated OPD bot reminder message in Hindi/Hinglish.
   */
  public speakAlert(params: {
    patientName: string;
    doctorName: string;
    tokenNumber: number;
    patientsAhead: number;
  }): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const aheadText = params.patientsAhead <= 1 ? 'agle mareez aap hi hain' : `aapke aage keval ${params.patientsAhead} mareez hain`;
      const text = `Namaste ${params.patientName} ji! Yeh Aarogya Clinic automated bot call hai. Dr. ${params.doctorName} ke cabin me aapka Token number ${params.tokenNumber} jald aane wala hai. Abhi ${aheadText}. Kripya agle das se pandrah minute me clinic pahunche. Dhanyawad!`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      // Prefer Hindi (hi-IN) or Indian English (en-IN)
      const indianVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN'));
      if (indianVoice) {
        utterance.voice = indianVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopAll(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceBot = new VoiceBotService();
