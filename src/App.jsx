import { useState, useRef } from "react";
import "./index.css";
import jackpotSound from "./assets/floraphonic-playful-casino-slot-machine-jackpot-3-183921.mp3";

const symbols = ["🍒","💎","7️⃣","🍀","⭐","🔔","🍉","🍇","💰","🃏"];

export default function App() {
  const [reels, setReels] = useState(["?", "?", "?"]);
  const [spinning, setSpinning] = useState(false);
  const [jackpot, setJackpot] = useState(false);

  const [entropy, setEntropy] = useState("");
  const [source, setSource] = useState("");
  const [hash, setHash] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [mapping, setMapping] = useState(null);
  const [resultReady, setResultReady] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const generateHash = async (input) => {
    const data = new TextEncoder().encode(input);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const fetchEntropy = async () => {
    const res = await fetch("https://quantum-slot.onrender.com/entropy");
  
    if (!res.ok) {
      throw new Error("Quantum fetch failed");
    }
  
    const data = await res.json();
  
    if (!data.entropy || data.entropy.length < 3) {
      throw new Error("Invalid entropy");
    }
  
    setSource(data.source);
    setTimestamp(data.timestamp);
    return data.entropy;
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const spin = async () => {
    if (spinning) return;
  
    setResultReady(false);
    setSpinning(true);
    setJackpot(false);
  
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  
    // start spinning animation
    intervalRef.current = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 80);
  
    // 🔥 run BOTH in parallel
    const entropyPromise = fetchEntropy();
  
    let ent;
    try {
      ent = await entropyPromise;
    } catch (e) {
      console.error("Quantum failed:", e);
  
      clearInterval(intervalRef.current);
      setSpinning(false);
      return;
    }
  
    // process data (but DON'T show yet)
    const h = await generateHash(ent.join("-"));
  
    const final = [
      symbols[ent[0] % symbols.length],
      symbols[(ent[1] + ent[3]) % symbols.length],
      symbols[(ent[2] + ent[5]) % symbols.length],
    ];
  
    const mappingData = {
      inputs: [ent[0], ent[1], ent[2]],
      outputs: final,
    };
  
    // ⏱ ensure minimum spin time (2s)
    setTimeout(() => {
      clearInterval(intervalRef.current);
  
      // stagger stops
      setReels([final[0], "?", "?"]);
  
      setTimeout(() => {
        setReels([final[0], final[1], "?"]);
      }, 300);
  
      setTimeout(() => {
        setReels(final);
  
        // 🔥 NOW update everything at once
        setEntropy(ent);
        setHash(h);
        setMapping(mappingData);
  
        setSpinning(false);
        setResultReady(true);
  
        if (final[0] === final[1] && final[1] === final[2]) {
          setJackpot(true);
          playSound();
        }
      }, 600);
  
    }, 2000);
  };
  return (
    <div className={`app ${jackpot ? "jackpot-bg shake" : ""}`}>
      <div className="overlay"></div>
  
      <div className="main-card">
        <h1 className="title">Quantum Slot Machine</h1>
  
        <div className="slot">
          {reels.map((r, i) => (
            <div
              key={i}
              className={`reel ${spinning ? "spin" : ""} ${jackpot ? "win" : ""}`}
            >
              {r}
            </div>
          ))}
        </div>
  
        <button className="spin-btn" onClick={spin}>
          🎰 Spin
        </button>
  
        {/* CONFETTI */}
        {jackpot && (
          <div className="confetti">
            {Array.from({ length: 200 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${Math.random() * 100}%`,
                  background: `hsl(${Math.random() * 360},100%,50%)`,
                  animationDelay: `${Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}
  
        <audio ref={audioRef} src={jackpotSound} />
  
        {resultReady && (
          <div className="panel">
            <p><b>Entropy:</b> {entropy.slice(0, 10).join(", ")}</p>
            <p><b>Source:</b> {source}</p>
            <p><b>Proof Hash:</b> {hash.slice(0, 16)}...</p>
            <p><b>Quantum Pulse:</b> {timestamp}</p>
            <p><b>Spin Time:</b> {new Date().toLocaleTimeString()}</p>
            {mapping && (<p style={{ fontSize: "13px", opacity: 0.8 }}>
            <b>Mapping:</b>{" "}
                {mapping.inputs.map((val, i) => (
                <span key={i}>
                {val} → {mapping.outputs[i]}{" "}
                </span>))}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}