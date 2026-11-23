import { DocumentChunk, VectorDocument } from '../types';

export const INITIAL_SECURITY_DOCUMENTS: VectorDocument[] = [
  {
    id: 'doc-regresshion-2024',
    title: 'CVE-2024-6387: OpenSSH regreSSHion Signal Handler Race Condition RCE',
    category: 'cve',
    chunksCount: 3,
    dateAdded: '2024-07-01',
    isEncrypted: true,
    tags: ['ssh', 'rce', 'linux', 'glibc', 'race-condition', 'critical'],
    content: `CVE-2024-6387 (dubbed "regreSSHion") is a critical signal handler race condition vulnerability in OpenSSH's server (sshd) in glibc-based Linux systems.
It allows unauthenticated remote code execution (RCE) as root.
Mechanism: When a client connects and fails to authenticate within LoginGraceTime (default 120 seconds), sshd's SIGALRM handler triggers.
The SIGALRM signal handler calls syslog(), which is not an async-signal-safe function. syslog() internally allocates and frees memory on the heap using glibc's malloc/free, leading to heap corruption and state manipulation.
Affected Versions: OpenSSH 8.5p1 through 9.7p1 (and earlier 3.4p1 to 4.2p1 before fix regression).
Mitigation: Set 'LoginGraceTime 0' in /etc/ssh/sshd_config (note: disables timeout, potential DoS) or upgrade to OpenSSH 9.8p1 or newer.
Testing POC logic involves precise memory layout grooming of malloc chunks over repeated TCP reconnects.`
  },
  {
    id: 'doc-linux-privesc-playbook',
    title: 'Linux Privilege Escalation & Kernel Exploit Playbook',
    category: 'pentest_guide',
    chunksCount: 4,
    dateAdded: '2024-08-15',
    isEncrypted: true,
    tags: ['privesc', 'linux', 'kernel', 'suid', 'capabilities', 'capabilities-cap-setuid'],
    content: `Local Privilege Escalation (LPE) methodology for Linux environments:
1. SUID Binaries Inspection:
   Command: find / -perm -u=s -type f 2>/dev/null
   Look for non-standard binaries or GTFOBins compatible binaries (e.g. nmap, vim, base64, find, python, bash, cp, pkexec).
2. Linux Capabilities:
   Command: getcap -r / 2>/dev/null
   Dangerous capabilities: cap_setuid+ep (can set UID to 0 in Python/Perl/tar), cap_dac_read_search (can read /etc/shadow directly), cap_sys_admin.
3. Sudo Misconfigurations:
   Command: sudo -l
   Check for NOPASSWD entries, wildcard permissions, or env_keep+=LD_PRELOAD / LD_LIBRARY_PATH which allows shared library injection.
4. Kernel Exploits (CVE-2024-1086 nf_tables UAF, CVE-2022-0847 Dirty Pipe):
   Check kernel version: uname -a. For nf_tables, exploits target the netfilter subsystem via unprivileged user namespaces (CLONE_NEWUSER).
   Mitigation: sysctl -w kernel.unprivileged_userns_clone=0`
  },
  {
    id: 'doc-ad-kerberos-roasting',
    title: 'Active Directory Kerberos Attacks: Kerberoasting & AS-REP Roasting',
    category: 'pentest_guide',
    chunksCount: 3,
    dateAdded: '2024-09-10',
    isEncrypted: true,
    tags: ['active-directory', 'kerberos', 'kerberoasting', 'asrep', 'hashcat', 'tgs'],
    content: `Active Directory Kerberos credential extraction methodology:
1. Kerberoasting:
   Principle: Any authenticated domain user can request a Kerberos Ticket Granting Service (TGS) ticket for any Service Principal Name (SPN) registered in the domain.
   The TGS ticket contains the service ticket encrypted with the NTLM hash of the service account.
   Extraction:
   Using Impacket: GetUserSPNs.py domain.local/user:password -request -dc-ip 10.0.0.1 -outputfile hashes.kerberoast
   Using Rubeus: Rubeus.exe kerberoast /outfile:hashes.txt
   Cracking: hashcat -m 13100 hashes.kerberoast /usr/share/wordlists/rockyou.txt
2. AS-REP Roasting:
   Principle: Accounts with 'Do not require Kerberos preauthentication' (DONT_REQ_PREAUTH) flag enabled can have AS-REP requests sent without providing a password timestamp.
   The KDC returns an AS-REP response encrypted with the user's password hash.
   Using Impacket: GetNPUsers.py domain.local/ -usersfile users.txt -format hashcat -outputfile asrep_hashes.txt -dc-ip 10.0.0.1
   Cracking: hashcat -m 18200 asrep_hashes.txt wordlist.txt`
  },
  {
    id: 'doc-ssrf-cloud-metadata',
    title: 'SSRF Cloud Metadata Exfiltration & IMDSv2 Bypass Analysis',
    category: 'payload',
    chunksCount: 3,
    dateAdded: '2024-10-01',
    isEncrypted: true,
    tags: ['ssrf', 'aws', 'cloud', 'imdsv2', 'gcp', 'metadata', 'tokens'],
    content: `Server-Side Request Forgery (SSRF) targeting Cloud Metadata Services:
1. AWS IMDSv1:
   Target: http://169.254.169.254/latest/meta-data/iam/security-credentials/<ROLE_NAME>
   Returns temporary AccessKeyId, SecretAccessKey, and Token directly via GET request.
2. AWS IMDSv2 (Session-oriented with Token Header):
   Requires PUT request with header 'X-aws-ec2-metadata-token-ttl-seconds: 21600' to obtain token:
   TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
   curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/
   Bypass scenarios: Open Reverse Proxies, WAF header forwarding, CVE-2022-26134 Confluence SSRF.
3. GCP Cloud Metadata:
   Target: http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
   Requires header: 'Metadata-Flavor: Google'
4. Obfuscation techniques for IP filters:
   - Decimal: 2852039166
   - Hexadecimal: 0xA9.0xFE.0xA9.0xFE
   - DNS Rebinding: custom domain resolving to 169.254.169.254 with TTL=0.`
  },
  {
    id: 'doc-proxy-airgap-architecture',
    title: 'Air-Gapped Workstation Isolation & SOCKS5 Tor Routing Protocols',
    category: 'pentest_guide',
    chunksCount: 3,
    dateAdded: '2024-10-20',
    isEncrypted: true,
    tags: ['airgap', 'tor', 'socks5', 'privacy', 'ip-leak', 'sandboxing'],
    content: `Architectural specifications for local security research without information leakage:
1. Air-Gap Strict Mode:
   Completely severs IP routing tables, drops all outbound TCP/UDP syn packets to external subnets (0.0.0.0/0), binds LLM sockets strictly to 127.0.0.1 or unix domain sockets.
   Local disk storage is encrypted with AES-256-GCM.
2. Sandboxed Egress via SOCKS5 / Tor:
   When automated research or OSINT is required:
   - Traffic is chained through local proxy daemon at 127.0.0.1:9050 (Tor) or 127.0.0.1:8080 (Upstream proxy).
   - DNS Resolution must occur on the remote proxy server (SOCKS5h) to prevent local ISP DNS leakage.
   - HTTP Headers must be stripped of identifying browser signatures (Sec-CH-UA, Accept-Language, Referer, Cookies).
   - User-Agent is normalized to standard hardened Linux Tor Browser bundle.`
  }
];

export const INITIAL_CHUNKS: DocumentChunk[] = [
  {
    id: 'chunk-1',
    docId: 'doc-regresshion-2024',
    title: 'CVE-2024-6387 OpenSSH regreSSHion Root Cause',
    category: 'cve',
    content: 'CVE-2024-6387 is a signal handler race condition in sshd LoginGraceTime on glibc Linux. Signal handler SIGALRM calls syslog(), which allocates heap memory with malloc/free, causing memory corruption and unauthenticated remote code execution as root.',
    metadata: {
      source: 'Qualys Security Advisory',
      cveId: 'CVE-2024-6387',
      severity: 'CRITICAL',
      tags: ['ssh', 'rce', 'glibc', 'race-condition'],
      createdAt: '2024-07-01'
    }
  },
  {
    id: 'chunk-2',
    docId: 'doc-regresshion-2024',
    title: 'CVE-2024-6387 Remediation & Configuration Hardening',
    category: 'cve',
    content: 'Mitigation for CVE-2024-6387: Set LoginGraceTime 0 in sshd_config or upgrade to OpenSSH 9.8p1. Setting timeout to 0 prevents the async signal handler from firing during authentication stall.',
    metadata: {
      source: 'Qualys Security Advisory',
      cveId: 'CVE-2024-6387',
      severity: 'HIGH',
      tags: ['ssh', 'hardening', 'config'],
      createdAt: '2024-07-01'
    }
  },
  {
    id: 'chunk-3',
    docId: 'doc-linux-privesc-playbook',
    title: 'Linux Capabilities Exploitation (cap_setuid)',
    category: 'pentest_guide',
    content: 'Exploiting cap_setuid+ep capability on binaries like python or perl: python3 -c "import os; os.setuid(0); os.system(\'/bin/bash\')". Check with getcap -r / 2>/dev/null to identify misconfigured binaries that allow elevating to root.',
    metadata: {
      source: 'GTFOBins / Pentest Playbook',
      severity: 'HIGH',
      tags: ['capabilities', 'privesc', 'python', 'root'],
      createdAt: '2024-08-15'
    }
  },
  {
    id: 'chunk-4',
    docId: 'doc-ad-kerberos-roasting',
    title: 'Active Directory Kerberoasting Methodology & Hashcat Mode',
    category: 'pentest_guide',
    content: 'Kerberoasting requests TGS tickets for accounts with ServicePrincipalNames. The tickets are encrypted with the account NTLM hash. Extracted with Impacket GetUserSPNs.py and cracked offline with hashcat -m 13100 using wordlists.',
    metadata: {
      source: 'AD Security Research',
      severity: 'HIGH',
      tags: ['kerberos', 'tgs', 'hashcat-13100', 'spn'],
      createdAt: '2024-09-10'
    }
  },
  {
    id: 'chunk-5',
    docId: 'doc-ssrf-cloud-metadata',
    title: 'AWS IMDSv1 vs IMDSv2 Token Header Enforcement',
    category: 'payload',
    content: 'AWS IMDSv1 allows direct GET to 169.254.169.254/latest/meta-data/iam/security-credentials/. IMDSv2 mitigates this by requiring PUT with X-aws-ec2-metadata-token-ttl-seconds: 21600 to acquire a session token first, blocking simple SSRF GET vectors.',
    metadata: {
      source: 'Cloud Security Research',
      severity: 'HIGH',
      tags: ['ssrf', 'aws', 'imdsv2', 'tokens'],
      createdAt: '2024-10-01'
    }
  },
  {
    id: 'chunk-6',
    docId: 'doc-proxy-airgap-architecture',
    title: 'SOCKS5 Proxy Remote DNS Resolution (SOCKS5h) to Prevent Leaks',
    category: 'pentest_guide',
    content: 'When configuring local tools to proxy through Tor or upstream SOCKS5, always use socks5h:// protocol instead of socks5:// so DNS requests are resolved on the exit proxy rather than leaking through the local ISP DNS resolver.',
    metadata: {
      source: 'Operational Security Standard',
      severity: 'CRITICAL',
      tags: ['dns-leak', 'tor', 'socks5h', 'opsec'],
      createdAt: '2024-10-20'
    }
  }
];
