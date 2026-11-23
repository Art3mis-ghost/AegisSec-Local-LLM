import React from 'react';

const DEFAULT_HACKING_COMMANDS = [
  "nmap -sS -T4 -p- -A --script vuln 10.10.10.14",
  "hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://10.10.10.5 -t 4",
  "sqlmap -u \"https://target-lab.internal/api?id=1\" --batch --dbs --random-agent --proxy=\"socks5://127.0.0.1:9050\"",
  "msfconsole -q -x \"use exploit/multi/handler; set PAYLOAD linux/x64/shell_reverse_tcp; run\"",
  "hashcat -m 13100 -a 0 kerberoast.txt rockyou.txt -r rules/best64.rule -O",
  "gobuster dir -u http://10.10.10.25 -w /usr/share/wordlists/dirb/big.txt -x php,txt,sh -t 40",
  "chisel client 10.10.14.3:8000 R:1080:socks",
  "nuclei -u https://target.lab -t cves/2024/ -proxy socks5://127.0.0.1:9050 -silent",
  "curl -s -k -H \"X-aws-ec2-metadata-token-ttl-seconds: 21600\" -X PUT http://169.254.169.254/latest/api/token",
  "proxychains4 nmap -sT -Pn -p 22,80,443,8080,8443 target.internal",
  "find / -perm -u=s -type f 2>/dev/null | grep -E \"(python|bash|vim|find|pkexec)\"",
  "binwalk -Me target_firmware.bin && checksec --file=./vulnerable_daemon",
  "impacket-secretsdump -just-dc-ntlm domain.local/admin:pass@10.0.0.1 -outputfile ntds.hashes",
  "strings /lib/x86_64-linux-gnu/libc.so.6 | grep -B 2 \"/bin/sh\"",
  "airmon-ng start wlan0 && airodump-ng --bssid 00:11:22:33:44:55 wlan0mon",
  "ROPgadget --binary ./vuln --ropchain | grep -E \"pop rdi ; ret\"",
  "subfinder -d target-domain.internal -silent | httpx -title -status-code -tech-detect"
];

interface CyberCommandTickerProps {
  userCommands?: string[];
  isBackground?: boolean;
}

export const CyberCommandTicker: React.FC<CyberCommandTickerProps> = ({
  userCommands = [],
  isBackground = false
}) => {
  // Combine custom user-entered commands with standard tools commands
  const combinedCommands = [
    ...userCommands.map(cmd => `user@fsociety:~$ ${cmd}`),
    ...DEFAULT_HACKING_COMMANDS
  ];

  if (isBackground) {
    return (
      <div className="absolute inset-0 flex flex-col justify-around py-4 pointer-events-none select-none z-0 overflow-hidden opacity-55">
        {/* Stream line 1: Emerald offensive commands */}
        <div className="flex whitespace-nowrap animate-ticker-slow-left-to-right font-mono text-xs text-emerald-400 font-semibold tracking-wider items-center gap-8 drop-shadow-[0_0_10px_rgba(34,197,94,0.75)]">
          {[...combinedCommands, ...combinedCommands].map((cmd, idx) => (
            <div key={`bg1-${idx}`} className="flex items-center gap-2 shrink-0">
              <span className="text-red-400 font-bold">$</span>
              <span className="text-emerald-300 drop-shadow-[0_0_10px_rgba(34,197,94,0.9)]">{cmd}</span>
              <span className="text-emerald-700 mx-3">■</span>
            </div>
          ))}
        </div>

        {/* Stream line 2: Cyan reconnaissance & OSINT commands */}
        <div className="flex whitespace-nowrap animate-ticker-slow-left-to-right font-mono text-xs text-cyan-300 font-medium tracking-wider items-center gap-8 -ml-52 drop-shadow-[0_0_10px_rgba(6,182,212,0.75)]">
          {[...combinedCommands.slice().reverse(), ...combinedCommands].map((cmd, idx) => (
            <div key={`bg2-${idx}`} className="flex items-center gap-2 shrink-0">
              <span className="text-amber-400 font-bold">#</span>
              <span className="text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]">{cmd}</span>
              <span className="text-cyan-700 mx-3">::</span>
            </div>
          ))}
        </div>

        {/* Stream line 3: Emerald & Purple exploitation commands */}
        <div className="flex whitespace-nowrap animate-ticker-slow-left-to-right font-mono text-xs text-emerald-400/90 font-medium tracking-wider items-center gap-8 -ml-96 drop-shadow-[0_0_10px_rgba(34,197,94,0.75)]">
          {[...combinedCommands, ...combinedCommands].map((cmd, idx) => (
            <div key={`bg3-${idx}`} className="flex items-center gap-2 shrink-0">
              <span className="text-purple-400 font-bold">➜</span>
              <span className="text-emerald-300 drop-shadow-[0_0_10px_rgba(34,197,94,0.85)]">{cmd}</span>
              <span className="text-emerald-600 mx-3">◆</span>
            </div>
          ))}
        </div>

        {/* Stream line 4: Amber & Red privileged root bash routines */}
        <div className="flex whitespace-nowrap animate-ticker-slow-left-to-right font-mono text-xs text-amber-300 font-medium tracking-wider items-center gap-8 -ml-28 drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]">
          {[...combinedCommands.slice().reverse(), ...combinedCommands].map((cmd, idx) => (
            <div key={`bg4-${idx}`} className="flex items-center gap-2 shrink-0">
              <span className="text-red-500 font-bold">root@fsociety:#</span>
              <span className="text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">{cmd}</span>
              <span className="text-amber-600 mx-3">///</span>
            </div>
          ))}
        </div>

        {/* Stream line 5: High-speed assembly / reverse engineering commands */}
        <div className="flex whitespace-nowrap animate-ticker-slow-left-to-right font-mono text-xs text-emerald-300 font-semibold tracking-wider items-center gap-8 -ml-80 drop-shadow-[0_0_10px_rgba(34,197,94,0.75)]">
          {[...combinedCommands, ...combinedCommands].map((cmd, idx) => (
            <div key={`bg5-${idx}`} className="flex items-center gap-2 shrink-0">
              <span className="text-cyan-400 font-bold">⚡</span>
              <span className="text-emerald-200 drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]">{cmd}</span>
              <span className="text-emerald-800 mx-3">■</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#050811] border-y border-emerald-900/60 overflow-hidden py-1.5 relative select-none shrink-0 shadow-[0_0_12px_rgba(34,197,94,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,17,0.9)_0%,transparent_10%,transparent_90%,rgba(5,8,17,0.9)_100%)] z-10 pointer-events-none" />

      {/* Marquee track moving from left to right at a controlled, readable slow pace */}
      <div className="flex whitespace-nowrap animate-ticker-slow-left-to-right font-mono text-[11px] text-emerald-400/90 font-medium tracking-wide items-center gap-6">
        {[...combinedCommands, ...combinedCommands].map((cmd, idx) => (
          <div key={idx} className="flex items-center gap-2 shrink-0">
            <span className="text-red-500 font-bold">$</span>
            <span className="text-emerald-300 hover:text-white transition-colors cursor-default drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
              {cmd}
            </span>
            <span className="text-emerald-900 mx-2" aria-hidden="true">■</span>
          </div>
        ))}
      </div>
    </div>
  );
};
