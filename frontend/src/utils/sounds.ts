// ICQ-style sound effects using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: { [key: string]: AudioBuffer | null } = {};

  constructor() {
    // Initialize AudioContext on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Generate classic ICQ "UH OH" sound using oscillators
  private generateICQMessage(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8; // 800ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Classic ICQ "UH OH" pattern
    const frequencies = [400, 300, 450, 350]; // Hz
    const segmentDuration = duration / frequencies.length;
    const samplesPerSegment = sampleRate * segmentDuration;

    frequencies.forEach((freq, segmentIndex) => {
      const startSample = segmentIndex * samplesPerSegment;
      const endSample = Math.min((segmentIndex + 1) * samplesPerSegment, data.length);

      for (let i = startSample; i < endSample; i++) {
        const t = (i - startSample) / sampleRate;
        const envelope = Math.exp(-t * 3); // Decay envelope
        const oscillation = Math.sin(2 * Math.PI * freq * t);
        data[i] = oscillation * envelope * 0.3; // Volume control
      }
    });

    return buffer;
  }

  // Generate notification beep
  private generateNotificationBeep(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 5);
      const oscillation = Math.sin(2 * Math.PI * 800 * t);
      data[i] = oscillation * envelope * 0.2;
    }

    return buffer;
  }

  // Generate typing notification sound
  private generateTypingSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      const noise = (Math.random() - 0.5) * 2;
      const tone = Math.sin(2 * Math.PI * 1200 * t);
      data[i] = (noise * 0.3 + tone * 0.7) * envelope * 0.1;
    }

    return buffer;
  }

  // Generate user online sound
  private generateUserOnlineSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Rising tone sequence
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 400 + (t / duration) * 300; // 400Hz to 700Hz
      const envelope = Math.sin(Math.PI * t / duration); // Bell curve envelope
      const oscillation = Math.sin(2 * Math.PI * frequency * t);
      data[i] = oscillation * envelope * 0.15;
    }

    return buffer;
  }

  // Initialize all sounds
  private initializeSounds() {
    if (!this.audioContext) return;

    this.sounds.message_received = this.generateICQMessage();
    this.sounds.message_sent = this.generateNotificationBeep();
    this.sounds.user_online = this.generateUserOnlineSound();
    this.sounds.typing = this.generateTypingSound();
  }

  // Play a specific sound
  async playSound(soundName: string, volume: number = 0.5) {
    try {
      await this.ensureAudioContext();
      
      if (!this.audioContext) {
        console.warn('AudioContext not available');
        return;
      }

      // Initialize sounds if not already done
      if (Object.keys(this.sounds).length === 0) {
        this.initializeSounds();
      }

      const buffer = this.sounds[soundName];
      if (!buffer) {
        console.warn(`Sound '${soundName}' not found`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Convenience methods for specific sounds
  async playMessageReceived() {
    await this.playSound('message_received', 0.4);
  }

  async playMessageSent() {
    await this.playSound('message_sent', 0.3);
  }

  async playUserOnline() {
    await this.playSound('user_online', 0.2);
  }

  async playTyping() {
    await this.playSound('typing', 0.1);
  }

  // Enable/disable sounds based on user preference
  private soundsEnabled: boolean = true;

  enableSounds(enabled: boolean) {
    this.soundsEnabled = enabled;
    localStorage.setItem('icq_sounds_enabled', enabled.toString());
  }

  areSoundsEnabled(): boolean {
    const stored = localStorage.getItem('icq_sounds_enabled');
    return stored !== null ? stored === 'true' : this.soundsEnabled;
  }

  // Play with user preference check
  async playSoundIfEnabled(soundName: string, volume?: number) {
    if (this.areSoundsEnabled()) {
      await this.playSound(soundName, volume);
    }
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export const playICQMessageSound = () => soundManager.playMessageReceived();
export const playICQSentSound = () => soundManager.playMessageSent();
export const playICQUserOnlineSound = () => soundManager.playUserOnline();
export const playICQTypingSound = () => soundManager.playTyping();

// Initialize audio context on user interaction
document.addEventListener('click', () => {
  soundManager.playSoundIfEnabled('message_sent', 0.01); // Very quiet test sound
}, { once: true });