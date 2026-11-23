import { AgentTool } from '../types';

const STORAGE_TOOLS_KEY = 'aegis_agent_tools_v1';

export const DEFAULT_AGENT_TOOLS: AgentTool[] = [
  {
    id: 'tool-nuclei',
    name: 'Nuclei Vulnerability Scanner',
    description: 'Fast and customizable vulnerability scanner based on simple YAML DSL templates. Detects zero-days, CVEs, and misconfigurations.',
    category: 'vulnerability',
    version: 'v3.3.2',
    sourceUrl: 'https://github.com/projectdiscovery/nuclei',
    binaryName: 'nuclei',
    isInstalled: true,
    isEnabled: true,
    isAirGapCompatible: true,
    permissionsRequired: ['network:raw_sockets', 'filesystem:read_templates'],
    lastUsedTimestamp: Date.now() - 7200000,
    cliCommandTemplate: 'nuclei -u {target} -t cves/2024/ -proxy {proxy} -silent -json',
    outputFormat: 'json'
  },
  {
    id: 'tool-subfinder',
    name: 'Subfinder Passive Recon',
    description: 'Fast passive subdomain discovery tool that aggregates data from dozens of public OSINT sources without touching target infrastructure.',
    category: 'osint',
    version: 'v2.6.6',
    sourceUrl: 'https://github.com/projectdiscovery/subfinder',
    binaryName: 'subfinder',
    isInstalled: true,
    isEnabled: true,
    isAirGapCompatible: false, // requires external proxy
    permissionsRequired: ['network:egress_proxy'],
    lastUsedTimestamp: Date.now() - 14400000,
    cliCommandTemplate: 'subfinder -d {target} -proxy {proxy} -silent',
    outputFormat: 'text'
  },
  {
    id: 'tool-sqlmap',
    name: 'SQLmap Database Auditor',
    description: 'Automatic SQL injection detection, database fingerprinting, and data exfiltration engine.',
    category: 'vulnerability',
    version: 'v1.8.8',
    sourceUrl: 'https://github.com/sqlmapproject/sqlmap',
    binaryName: 'sqlmap',
    isInstalled: true,
    isEnabled: true,
    isAirGapCompatible: true,
    permissionsRequired: ['network:http_raw', 'filesystem:write_loot'],
    lastUsedTimestamp: Date.now() - 86400000,
    cliCommandTemplate: 'sqlmap -u "{target}" --batch --proxy="{proxy}" --risk=1 --level=1',
    outputFormat: 'text'
  },
  {
    id: 'tool-amass',
    name: 'OWASP Amass Attack Surface Mapper',
    description: 'In-depth attack surface mapping, asset discovery, and active/passive graph relationship correlation.',
    category: 'recon',
    version: 'v4.2.0',
    sourceUrl: 'https://github.com/owasp-amass/amass',
    binaryName: 'amass',
    isInstalled: true,
    isEnabled: false,
    isAirGapCompatible: false,
    permissionsRequired: ['network:egress_proxy', 'network:dns_resolver'],
    cliCommandTemplate: 'amass enum -d {target} -active=false -silent',
    outputFormat: 'json'
  },
  {
    id: 'tool-impacket',
    name: 'Impacket Network Protocol Suite',
    description: 'Python toolkit for crafting and manipulating raw network protocol packets (SMB, Kerberos, MSRPC, LDAP).',
    category: 'exploit',
    version: 'v0.12.0',
    sourceUrl: 'https://github.com/fortra/impacket',
    binaryName: 'impacket-GetUserSPNs',
    isInstalled: true,
    isEnabled: true,
    isAirGapCompatible: true,
    permissionsRequired: ['network:tcp_syn', 'network:kerberos'],
    cliCommandTemplate: 'python3 -m impacket.GetUserSPNs {target} -request -dc-ip {dc_ip}',
    outputFormat: 'text'
  },
  {
    id: 'tool-jwt-tool',
    name: 'JWT Tool Token Suite',
    description: 'Comprehensive toolkit for validating, forging, testing signature bypasses, and cracking JSON Web Tokens.',
    category: 'vulnerability',
    version: 'v2.2.8',
    sourceUrl: 'https://github.com/ticarpi/jwt_tool',
    binaryName: 'jwt_tool',
    isInstalled: true,
    isEnabled: true,
    isAirGapCompatible: true,
    permissionsRequired: ['crypto:hmac_bruteforce'],
    cliCommandTemplate: 'python3 jwt_tool.py {token} -X a -T -M pb',
    outputFormat: 'text'
  }
];

class ToolService {
  private tools: AgentTool[] = [];

  constructor() {
    this.initTools();
  }

  private initTools() {
    try {
      const saved = localStorage.getItem(STORAGE_TOOLS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tools = parsed;
          return;
        }
      }
      this.tools = [...DEFAULT_AGENT_TOOLS];
      this.persist();
    } catch {
      this.tools = [...DEFAULT_AGENT_TOOLS];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(this.tools));
    } catch {
      // storage error handling
    }
  }

  public getTools(): AgentTool[] {
    return this.tools;
  }

  public toggleTool(id: string): boolean {
    const tool = this.tools.find(t => t.id === id);
    if (!tool) return false;
    tool.isEnabled = !tool.isEnabled;
    this.persist();
    return tool.isEnabled;
  }

  public uninstallTool(id: string): boolean {
    this.tools = this.tools.filter(t => t.id !== id);
    this.persist();
    return true;
  }

  public resetToDefaults() {
    this.tools = [...DEFAULT_AGENT_TOOLS];
    this.persist();
    return this.tools;
  }

  public installToolFromGitHub(params: {
    githubUrl: string;
    customName?: string;
    description?: string;
    category?: AgentTool['category'];
    binaryName?: string;
    cliCommandTemplate?: string;
    isAirGapCompatible?: boolean;
  }): { success: boolean; tool?: AgentTool; error?: string } {
    let url = params.githubUrl.trim();
    if (!url) return { success: false, error: 'GitHub URL cannot be empty.' };

    // Standardize URL: if user enters "projectdiscovery/naabu" -> convert to https://github.com/projectdiscovery/naabu
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('/')) {
        url = `https://github.com/${url.replace(/^\/+/, '')}`;
      } else {
        return { success: false, error: 'Invalid repository format. Please provide https://github.com/owner/repo or owner/repo' };
      }
    }

    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length < 2) {
        return { success: false, error: 'Could not extract repository owner and name from URL.' };
      }

      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, '');
      const toolId = `tool-gh-${repo.toLowerCase()}-${Date.now().toString(36)}`;
      
      const name = params.customName?.trim() || `${repo.charAt(0).toUpperCase() + repo.slice(1)} Tool`;
      const binary = params.binaryName?.trim() || repo.toLowerCase();
      const description = params.description?.trim() || `Automated security tool imported from GitHub: ${owner}/${repo}. Ready for autonomous agent invocation.`;
      const category = params.category || 'custom_github';
      const cliTemplate = params.cliCommandTemplate?.trim() || `${binary} -target {target} -proxy {proxy}`;

      const newTool: AgentTool = {
        id: toolId,
        name,
        description,
        category,
        version: 'main (git-latest)',
        sourceUrl: url,
        binaryName: binary,
        isInstalled: true,
        isEnabled: true,
        isAirGapCompatible: params.isAirGapCompatible ?? true,
        permissionsRequired: ['filesystem:read_write', 'process:exec'],
        cliCommandTemplate: cliTemplate,
        outputFormat: 'json',
        lastUsedTimestamp: Date.now()
      };

      this.tools.unshift(newTool);
      this.persist();
      return { success: true, tool: newTool };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to parse GitHub URL.' };
    }
  }

  public simulateToolRun(toolId: string, target = '127.0.0.1'): {
    commandExecuted: string;
    exitCode: number;
    rawOutput: string;
    elapsedMs: number;
  } {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) throw new Error('Tool not found');

    tool.lastUsedTimestamp = Date.now();
    this.persist();

    const cmd = tool.cliCommandTemplate
      .replace('{target}', target)
      .replace('{proxy}', 'socks5://127.0.0.1:9050')
      .replace('{dc_ip}', '10.0.0.1');

    let output = '';
    if (tool.id.includes('nuclei')) {
      output = `[INF] Loading Nuclei engine ${tool.version}...
[INF] Loaded 1,420 air-gapped vulnerability templates from local cache.
[INF] Scanning target: ${target} through SOCKS5 proxy...
[CVE-2024-6387] [network] [critical] OpenSSH regreSSHion race condition potential detected.
[info] [http] [low] Strict-Transport-Security header present.
[INF] Scan finished. 1 critical, 1 informational finding.`;
    } else if (tool.id.includes('subfinder')) {
      output = `[INF] Enumerating subdomains for ${target} using 18 passive OSINT sources...
api.${target}
vpn.${target}
auth.${target}
internal-admin.${target}
[INF] Found 4 unique subdomains in 1.48s. Zero packet egress to target network.`;
    } else if (tool.id.includes('sqlmap')) {
      output = `[*] Starting sqlmap ${tool.version} in batch mode...
[INFO] Testing connection to target ${target}...
[INFO] Checking if target URL is stable.
[INFO] Target parameter 'id' is vulnerable to boolean-based blind SQLi.
[+] DBMS: PostgreSQL >= 14.0
[+] Web Server: Nginx 1.24`;
    } else {
      output = `[*] Executing: ${cmd}
[+] Initializing environment sandbox...
[+] Process spawned under sandboxed UID 1001.
[+] Output captured successfully: 0 errors detected.
[+] Exit code: 0`;
    }

    return {
      commandExecuted: cmd,
      exitCode: 0,
      rawOutput: output,
      elapsedMs: 840
    };
  }
}

export const toolService = new ToolService();
