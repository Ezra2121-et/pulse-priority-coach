import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX, Coffee } from "lucide-react";

type SoundType = "none" | "rain" | "lofi" | "whitenoise";
type TimerPhase = "focus" | "break";

// Ambient sound generators using Web Audio API
function createNoiseNode(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  return node;
}

export function PomodoroTimer() {
  const [open, setOpen] = useState(false);
  const [focusDuration, setFocusDuration] = useState([25]);
  const [breakDuration, setBreakDuration] = useState([5]);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [sound, setSound] = useState<SoundType>("none");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const totalSeconds = phase === "focus" ? focusDuration[0] * 60 : breakDuration[0] * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  // Timer tick
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Switch phase
          const nextPhase: TimerPhase = phase === "focus" ? "break" : "focus";
          setPhase(nextPhase);
          setRunning(false);
          return nextPhase === "focus" ? focusDuration[0] * 60 : breakDuration[0] * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, phase, focusDuration, breakDuration]);

  // Sound management
  useEffect(() => {
    if (sound === "none" || !running) {
      if (noiseRef.current) {
        try { noiseRef.current.stop(); } catch {}
        noiseRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      return;
    }

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const gain = ctx.createGain();
    gainRef.current = gain;
    gain.gain.value = 0.15;
    gain.connect(ctx.destination);

    const noise = createNoiseNode(ctx);
    noiseRef.current = noise;

    // Apply different filters for different sounds
    if (sound === "rain") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;
      noise.connect(filter);
      filter.connect(gain);
    } else if (sound === "lofi") {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      noise.connect(filter);
      filter.connect(gain);
    } else {
      noise.connect(gain);
    }

    noise.start();

    return () => {
      try { noise.stop(); } catch {}
      ctx.close();
    };
  }, [sound, running]);

  const reset = useCallback(() => {
    setRunning(false);
    setPhase("focus");
    setTimeLeft(focusDuration[0] * 60);
  }, [focusDuration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const sounds: { key: SoundType; label: string }[] = [
    { key: "none", label: "Off" },
    { key: "rain", label: "🌧️ Rain" },
    { key: "lofi", label: "🎵 Lo-fi" },
    { key: "whitenoise", label: "📻 White" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Timer className="h-3 w-3" />
          Pomodoro
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-glass-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-gradient flex items-center gap-2">
            {phase === "focus" ? <Timer className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
            {phase === "focus" ? "Focus Time" : "Break Time"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Circular progress */}
          <div className="relative flex items-center justify-center">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.25 0.02 260)" strokeWidth="4" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={phase === "focus" ? "oklch(0.65 0.22 260)" : "oklch(0.70 0.18 155)"}
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-mono font-bold tabular-nums">
                {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
              </span>
              <p className="text-xs text-muted-foreground mt-1 uppercase">{phase}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              className={`gap-2 ${phase === "focus" ? "glow-primary" : ""}`}
              onClick={() => setRunning(!running)}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </Button>
          </div>

          {/* Ambient sounds */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {sound !== "none" ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              Ambient Sounds
            </Label>
            <div className="flex gap-2">
              {sounds.map((s) => (
                <Button
                  key={s.key}
                  variant={sound === s.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs flex-1"
                  onClick={() => setSound(s.key)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration settings */}
          {!running && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Focus: {focusDuration[0]}min</Label>
                <Label className="text-xs">Break: {breakDuration[0]}min</Label>
              </div>
              <Slider value={focusDuration} onValueChange={(v) => { setFocusDuration(v); if (phase === "focus") setTimeLeft(v[0] * 60); }} min={5} max={60} step={5} />
              <Slider value={breakDuration} onValueChange={(v) => { setBreakDuration(v); if (phase === "break") setTimeLeft(v[0] * 60); }} min={1} max={15} step={1} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
