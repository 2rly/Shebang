import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { securityProducts, alertHistory } from "@/data/security-products";

/**
 * "bash" — shebang.az's witty cybersecurity engineer.
 *
 * Deep integrations:
 *  - Release Radar: live CVE/patch data from security-products.ts
 *  - Community: trending threads by upvote score
 *  - Articles: recently approved articles
 *  - Shell Anatomy: command explanation redirect
 *  - Binary Intel: package lookup redirect
 *  - Security guardrails: refuses to generate malicious code
 *
 * Conversation history persisted per-user in SQLite.
 *
 * To upgrade to a real LLM, pass SYSTEM_PROMPT as the system message
 * and the conversation rows as the messages array.
 */

export const SYSTEM_PROMPT = `You are "bash", a witty and expert Cyber Security Engineer who works at shebang.az — a cybersecurity engineering platform.

PERSONALITY:
- You speak like a seasoned root administrator — professional, technically deep, yet slightly sarcastic about "script kiddies"
- You use terminal metaphors naturally ("let me grep that for you", "piping this through my brain", "404: stupidity not found")
- You reference Linux/Unix culture and hacker lore
- You occasionally drop security wisdom like "trust but verify... actually, just verify"
- You sign off important advice with security reminders
- You are dismissive of lazy security practices ("chmod 777? Are you inviting the whole internet to dinner?")

CAPABILITIES:
- Linux administration, shell scripting, command explanation
- Network security: nmap, firewalls, IDS/IPS, packet analysis
- Penetration testing methodology and tools
- SIEM/EDR configuration and log analysis
- Incident response playbooks and forensics
- Malware analysis and reverse engineering concepts
- Security architecture and hardening
- Navigate users to shebang.az tools: Shell Anatomy, Binary Intel, Release Radar, Cheatsheets, Tools

SECURITY GUARDRAILS:
- NEVER generate actual malicious code, exploits, or weaponized scripts
- When shown suspicious code, ANALYZE it as a security auditor would — explain what it does and the risks
- Always emphasize getting written authorization before any testing
- Recommend defensive measures over offensive techniques
- If asked to create something harmful, redirect to the defensive/analysis perspective

INTEGRATIONS (use context provided in each message):
- Release Radar data: CVEs, patches, product versions
- Community: trending threads
- Articles: recently approved content
- Shell Anatomy: redirect users there for deep command breakdowns
- Binary Intel: redirect users there for package lookups`;

// ── Live data fetchers ──

function getRadarContext(): string {
  const cveAlerts = alertHistory.filter((a) => a.type === "cve");
  const patchAlerts = alertHistory.filter((a) => a.type === "patch");
  const productsWithCves = securityProducts.filter((p) => p.cveCount > 0);

  let ctx = `\n[RELEASE RADAR DATA — ${securityProducts.length} products monitored]\n`;
  ctx += `Active CVEs: ${cveAlerts.length} | Patches: ${patchAlerts.length}\n`;

  if (productsWithCves.length > 0) {
    ctx += `Products with CVEs: ${productsWithCves.map((p) => `${p.name} (${p.cveCount} CVE)`).join(", ")}\n`;
  }

  ctx += `Recent alerts:\n`;
  for (const a of alertHistory.slice(0, 6)) {
    ctx += `  - [${a.severity}] ${a.title} (${a.date})\n`;
  }

  return ctx;
}

function getTrendingPosts(): string {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT p.title, u.username, (p.upvotes - p.downvotes) AS score, p.category,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS replies
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY score DESC, p.created_at DESC
      LIMIT 5
    `).all() as Array<{ title: string; username: string; score: number; category: string; replies: number }>;

    if (rows.length === 0) return "\n[COMMUNITY — No threads yet]\n";

    let ctx = `\n[TRENDING COMMUNITY THREADS]\n`;
    for (const r of rows) {
      ctx += `  - "${r.title}" by ${r.username} [+${r.score}] (${r.replies} replies) in ${r.category}\n`;
    }
    return ctx;
  } catch {
    return "\n[COMMUNITY — unavailable]\n";
  }
}

function getRecentArticles(): string {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT a.title, u.username, a.tags, a.created_at
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.status = 'approved'
      ORDER BY a.created_at DESC
      LIMIT 5
    `).all() as Array<{ title: string; username: string; tags: string; created_at: string }>;

    if (rows.length === 0) return "\n[ARTICLES — No approved articles yet]\n";

    let ctx = `\n[RECENTLY APPROVED ARTICLES]\n`;
    for (const r of rows) {
      const tags = JSON.parse(r.tags || "[]").join(", ");
      ctx += `  - "${r.title}" by ${r.username}${tags ? ` [${tags}]` : ""} (${r.created_at})\n`;
    }
    return ctx;
  } catch {
    return "\n[ARTICLES — unavailable]\n";
  }
}

// ── Security guardrails ──

const MALICIOUS_PATTERNS = [
  /write\s+(a\s+)?virus/i,
  /create\s+(a\s+)?(malware|ransomware|trojan|worm|keylogger|backdoor|rootkit)/i,
  /generate\s+(a\s+)?(exploit|payload|shellcode|reverse\s*shell)/i,
  /how\s+to\s+hack\s+into/i,
  /ddos\s+(script|attack|tool)/i,
  /make\s+(a\s+)?botnet/i,
  /bypass\s+(antivirus|edr|detection)/i,
  /write\s+(a\s+)?phishing/i,
];

function isBlockedRequest(msg: string): string | null {
  for (const p of MALICIOUS_PATTERNS) {
    if (p.test(msg)) {
      return `\`\`\`
[SEC-GUARDRAIL] Request blocked by security policy
\`\`\`

Nice try, script kiddie. 😏

I'm a **security auditor**, not a weapons dealer. I don't generate malicious code, exploits, or attack tools.

What I *can* do:
- **Analyze** suspicious code you've found and explain the risks
- **Explain** how attack techniques work from a **defensive** perspective
- **Recommend** detection and mitigation strategies
- **Help** you set up honeypots to catch attackers

If you're doing authorized pentesting, use established frameworks like Metasploit and get **written permission** first.

As we say in the SOC: *"The best offense is a good defense... and good logging."*`;
    }
  }
  return null;
}

// ── Command detection for Shell Anatomy / Binary Intel integration ──

function detectCommand(msg: string): string | null {
  // Check if the message starts with a common command pattern
  const cmdMatch = msg.match(/^(sudo\s+)?([a-z][\w.-]*)\s+/i);
  if (!cmdMatch) return null;

  const bin = cmdMatch[2].toLowerCase();
  const knownBins = [
    "ls", "cat", "grep", "find", "awk", "sed", "curl", "wget", "ssh", "scp",
    "rsync", "tar", "chmod", "chown", "ps", "kill", "top", "htop", "df", "du",
    "mount", "umount", "systemctl", "journalctl", "ip", "ss", "netstat",
    "tcpdump", "nmap", "dig", "nslookup", "traceroute", "ping",
    "openssl", "gpg", "base64", "xxd", "hexdump", "strings",
    "docker", "kubectl", "git", "make", "gcc", "python", "python3",
    "iptables", "nft", "ufw", "firewall-cmd",
    "useradd", "usermod", "passwd", "visudo",
    "crontab", "at", "systemd-analyze",
    "apt", "yum", "dnf", "pacman", "snap", "flatpak", "brew",
    "nikto", "sqlmap", "gobuster", "hydra", "john", "hashcat",
    "wireshark", "tshark", "aircrack-ng", "metasploit", "msfconsole",
  ];

  if (knownBins.includes(bin)) return bin;
  return null;
}

function buildCommandResponse(msg: string, bin: string): string {
  return `I see you've entered a \`${bin}\` command. Let me break it down:

\`\`\`
${msg.trim()}
\`\`\`

For a **full visual breakdown** of every flag, argument, and pipe in this command, head to **Shell Anatomy** on the sidebar — it'll dissect this into an interactive diagram powered by explainshell.com.

**Quick notes on \`${bin}\`:**
${getCommandNotes(bin)}

Want to know which package provides \`${bin}\`? Check **Binary Intel** — it'll tell you the package name and install commands across every major distro.`;
}

function getCommandNotes(bin: string): string {
  const notes: Record<string, string> = {
    nmap: "- Network mapper for host discovery and port scanning\n- Always get **written authorization** before scanning\n- Use `-oA` to save all output formats simultaneously",
    iptables: "- Legacy Linux firewall (consider `nftables` on modern distros)\n- Rules are evaluated top-to-bottom, first match wins\n- Use `-L -n -v --line-numbers` to inspect current rules",
    tcpdump: "- The Swiss Army knife of packet capture\n- Use `-w` to save pcap for Wireshark analysis\n- Filter with BPF: `tcpdump -i eth0 port 443 and host 10.0.0.1`",
    curl: "- Versatile HTTP/S client for API testing\n- `-k` skips SSL verification (use in labs only!)\n- `-v` for verbose output including TLS handshake details",
    find: "- Recursive file search with powerful filters\n- `find / -perm -4000` finds SUID binaries (privesc check)\n- Combine with `-exec` for batch operations",
    grep: "- Pattern matching on steroids\n- `-r` for recursive, `-i` for case-insensitive\n- `-P` enables Perl regex for advanced patterns",
    docker: "- Container runtime — scan images with `trivy` before deploying\n- Never run containers as root unless absolutely necessary\n- Use `--read-only` filesystem where possible",
    kubectl: "- Kubernetes CLI — audit RBAC with `kubectl auth can-i --list`\n- Check for exposed secrets: `kubectl get secrets -A`\n- Use network policies to segment pod communication",
    ss: "- Modern replacement for `netstat`\n- `ss -tulpn` shows all listening TCP/UDP ports with PIDs\n- `ss -s` for quick socket statistics",
    openssl: "- Swiss Army knife for TLS/SSL operations\n- `openssl s_client -connect host:443` tests TLS handshakes\n- `openssl x509 -in cert.pem -text` inspects certificates",
  };

  return notes[bin] || `- Use \`man ${bin}\` or \`${bin} --help\` for full documentation\n- Head to **Binary Intel** for package info across distros\n- Check **Shell Anatomy** for a visual flag breakdown`;
}

// ── Keyword-matched deep responses ──

const responses: { patterns: RegExp[]; reply: (ctx: string) => string }[] = [
  {
    patterns: [/cve/i, /vuln/i, /threat/i, /release.*radar/i, /latest.*update/i, /patch/i, /security\s*update/i],
    reply: (ctx) => `Let me pull the latest from our **Release Radar** feed...

${ctx}

**Critical items to action NOW:**
${alertHistory
  .filter((a) => a.severity === "CRITICAL")
  .slice(0, 3)
  .map((a) => `- 🔴 **${a.title}** — [Details](${a.link})`)
  .join("\n") || "- No CRITICAL alerts at this time. Stay vigilant."}

**Products needing attention:**
${securityProducts
  .filter((p) => p.cveCount > 0)
  .map((p) => `- ⚠️ **${p.name}** (${p.vendor}): ${p.cveCount} CVE${p.cveCount > 1 ? "s" : ""}, ${p.patchCount} patch${p.patchCount !== 1 ? "es" : ""} — Latest: \`${p.latestVersion}\``)
  .join("\n") || "- All products clean. Good hygiene, operator."}

Head to **Release Radar** on the sidebar for the full dashboard with version tracking and export to CSV.

*Remember: patch early, patch often. The only good vulnerability is a patched one.*`,
  },
  {
    patterns: [/trending/i, /community/i, /thread/i, /forum/i, /discuss/i, /popular/i],
    reply: (_ctx) => {
      const trending = getTrendingPosts();
      return `Let me check what the community is buzzing about...
${trending}
Head to the **Community** section on the sidebar to join the discussions, vote on threads, and drop your knowledge.

Pro tip: The best security engineers are the ones who share knowledge. Don't be a silo — be a \`/dev/stdout\`.`;
    },
  },
  {
    patterns: [/article/i, /blog/i, /read/i, /published/i, /approved/i, /new\s*content/i],
    reply: (_ctx) => {
      const articles = getRecentArticles();
      return `Let me check the latest from our editorial pipeline...
${articles}
Want to **contribute**? Head to **Articles** on the sidebar and hit "Submit Article". Every submission goes through admin review before publishing.

*"The security community grows stronger when we document what we learn." — bash*`;
    },
  },
  {
    patterns: [/nmap/i, /port\s*scan/i, /scan.*port/i, /host.*discover/i],
    reply: () => `\`\`\`bash
# Quick host discovery + service scan
nmap -sV -sC -O -oN scan_results.txt <target>

# Stealth SYN scan on all ports
nmap -sS -p- -T4 --min-rate 1000 <target>

# Vuln scan with NSE scripts
nmap --script vuln -p 80,443 <target>

# UDP scan (slow but important)
nmap -sU --top-ports 100 -T4 <target>
\`\`\`

⚠️ **AUTHORIZATION REQUIRED** — I've personally seen people get fired (and worse) over unauthorized scans. Get it in writing. Every. Single. Time.

Use \`-oA\` to save all output formats at once. Your future forensic self will thank you.

Want to understand every flag? Paste the full command into **Shell Anatomy** for an interactive breakdown.`,
  },
  {
    patterns: [/iptables/i, /firewall/i, /ufw/i, /nftables/i],
    reply: () => `Here's a production-grade baseline firewall config:

\`\`\`bash
# Flush existing rules
iptables -F && iptables -X

# Default policies: deny all incoming, allow outgoing
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow SSH (change port in production!)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Rate limit SSH to prevent brute force
iptables -A INPUT -p tcp --dport 22 -m recent --set --name SSH
iptables -A INPUT -p tcp --dport 22 -m recent --update \\
  --seconds 60 --hitcount 4 --name SSH -j DROP

# Log dropped packets (watch /var/log/kern.log)
iptables -A INPUT -j LOG --log-prefix "[FW-DROP] " --log-level 4
iptables -A INPUT -j DROP
\`\`\`

On modern systems, consider \`nftables\` — it's iptables' successor with cleaner syntax. And if you're on Ubuntu, \`ufw\` wraps it nicely for humans.

*"Default deny" is not paranoia. It's professionalism.*`,
  },
  {
    patterns: [/password/i, /credential/i, /hash/i, /crack/i, /brute/i],
    reply: () => `Let me pipe this through my security brain...

**Password Security Checklist:**
- Minimum 16 chars, use a password manager (Bitwarden, KeePassXC)
- Enable MFA everywhere — TOTP > SMS (SIM swap is real)
- For hashing in apps: **argon2id** > bcrypt > scrypt. Never MD5/SHA1
- Check breaches: haveibeenpwned.com

**For authorized auditing only:**
\`\`\`bash
# Hash identification
hashid <hash_string>

# Hashcat (GPU-accelerated)
hashcat -m 0 hashes.txt wordlist.txt -r rules/best64.rule

# John the Ripper (CPU)
john --wordlist=rockyou.txt --rules hashes.txt

# Generate a secure password from terminal
openssl rand -base64 32
\`\`\`

The best password is one you don't have to remember. Use a manager. Period.

⚠️ These tools are for **authorized security audits only**. Document everything.`,
  },
  {
    patterns: [/log/i, /siem/i, /elastic/i, /splunk/i, /wazuh/i, /qradar/i],
    reply: () => `Ah, log analysis — where the truth hides in plain text. Let me \`tail -f\` my knowledge...

**Quick log triage commands:**
\`\`\`bash
# Find failed SSH logins
grep "Failed password" /var/log/auth.log | \\
  awk '{print $11}' | sort | uniq -c | sort -rn | head -20

# Apache/Nginx top talkers
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20

# Find large transfers (potential exfil)
awk '$10 > 1000000 {print $1, $7, $10}' access.log

# Suspicious cron activity
grep -r "crontab" /var/log/auth.log | grep -v "LIST"
\`\`\`

**SIEM by scale:**
- Solo/Small: **Wazuh** (free, HIDS + SIEM + compliance)
- Mid-size: **Elastic Security** (ELK + detection rules)
- Enterprise: **Splunk** or **IBM QRadar**

Check **Release Radar** for the latest versions — ${
  securityProducts.find((p) => p.name === "IBM QRadar SIEM")
    ? `QRadar is at \`${securityProducts.find((p) => p.name === "IBM QRadar SIEM")!.latestVersion}\``
    : "we track all major SIEM products"
}.`,
  },
  {
    patterns: [/incident/i, /breach/i, /compromised/i, /attack/i, /respond/i, /forensic/i],
    reply: () => `🔴 **INCIDENT RESPONSE — ENGAGE PROTOCOL**

**Phase 1: CONTAIN (minutes, not hours)**
\`\`\`bash
# Network isolation — allow only your forensic workstation
iptables -I INPUT -s <forensic_ip> -j ACCEPT
iptables -I INPUT -j DROP
iptables -I OUTPUT -d <forensic_ip> -j ACCEPT
iptables -I OUTPUT -j DROP
\`\`\`

**Phase 2: PRESERVE EVIDENCE (before ANY remediation)**
\`\`\`bash
# Volatile data capture (order matters!)
date > /evidence/timeline.txt
ps auxf >> /evidence/timeline.txt
ss -tulpn >> /evidence/timeline.txt
lsof -i >> /evidence/timeline.txt
cat /proc/*/maps >> /evidence/timeline.txt 2>/dev/null
ip neigh >> /evidence/timeline.txt
last -aiF >> /evidence/timeline.txt

# Memory acquisition (use LiME or avml)
insmod lime.ko "path=/evidence/mem.lime format=lime"

# Disk image with integrity hash
dc3dd if=/dev/sda of=/evidence/disk.img hash=sha256 \\
  log=/evidence/hash.log
\`\`\`

**Phase 3: INVESTIGATE** — Logs, network connections, cron, authorized_keys, /tmp

**Phase 4: ERADICATE** — Rebuild from known-good, rotate ALL credentials

**Phase 5: DOCUMENT** — Timeline, IoCs, lessons learned

⚠️ **CRITICAL**: Evidence before remediation. Always. Wiping a compromised box without imaging it first is like contaminating a crime scene.`,
  },
  {
    patterns: [/help/i, /what can you/i, /who are you/i, /what.*do/i, /navigate/i, /menu/i],
    reply: () => `I'm **bash** — your resident cybersecurity engineer at shebang.az. Think of me as that senior engineer who actually answers your Slack messages... with slightly more sarcasm.

**What I can do:**
- 🐧 **Linux commands** — explain, optimize, and secure
- 🔒 **Security hardening** — firewalls, access controls, encryption
- 🔍 **Vulnerability intel** — live CVE data from Release Radar
- 🚨 **Incident response** — triage playbooks, evidence collection
- 📊 **Tool comparison** — SIEM, EDR, scanners, and more
- 💬 **Community pulse** — trending discussions and new articles
- 🛠️ **Platform navigation** — I know every corner of shebang.az

**Platform quick links:**
- **Shell Anatomy** — paste any command for a visual breakdown
- **Binary Intel** — find which package provides any binary
- **Release Radar** — track security product versions and CVEs
- **Cheatsheets** — Linux, Python, Windows quick references
- **Community** — discussion threads with voting
- **Articles** — community-written, admin-reviewed content

\`\`\`
$ bash --topics
  nmap, firewalls, passwords, SIEM/logs, Linux, incident-response,
  CVEs/patches, community, articles, malware-analysis, hardening
\`\`\`

I don't bite... unless you're running as root on a production box.`,
  },
  {
    patterns: [/linux/i, /command/i, /terminal/i, /shell/i, /^bash$/i],
    reply: () => `You rang? I *am* bash, after all.

**Essential security commands every operator should know:**
\`\`\`bash
# Find SUID binaries (potential privilege escalation)
find / -perm -4000 -type f 2>/dev/null

# List open ports and owning processes
ss -tulpn

# Check for rootkits
chkrootkit && rkhunter --check

# Monitor real-time connections
watch -n 1 'ss -tulpn | grep ESTAB'

# File integrity baseline
find /etc -type f -exec sha256sum {} \\; > /root/baseline.sha256

# Find world-writable files (bad hygiene)
find / -xdev -type f -perm -0002 2>/dev/null

# Check for unauthorized SSH keys
find / -name authorized_keys -exec cat {} \\; 2>/dev/null
\`\`\`

Head to **Shell Anatomy** to dissect any command you're unsure about — it breaks down every flag and pipe interactively.

*"A good sysadmin types less but knows more. A great one automates everything and goes home early."*`,
  },
  {
    patterns: [/malware/i, /reverse.*engineer/i, /suspicious.*code/i, /analyze.*script/i, /deobfuscat/i],
    reply: () => `🔬 **Malware Analysis — The bash Way**

**Static Analysis (safe, no execution):**
\`\`\`bash
# File type identification
file suspicious_binary
strings suspicious_binary | less

# Check for known hashes
sha256sum suspicious_binary
# Compare against VirusTotal, MalwareBazaar

# PE analysis (Windows binaries)
peframe suspicious.exe
pefile-info suspicious.exe

# ELF analysis (Linux binaries)
readelf -a suspicious_elf
objdump -d suspicious_elf | head -100
\`\`\`

**Dynamic Analysis (in an isolated sandbox ONLY):**
\`\`\`bash
# Use a disposable VM, never bare metal!
# Monitor system calls
strace -f -o trace.log ./suspicious_binary

# Monitor network activity
tcpdump -i any -w capture.pcap &

# Monitor file changes
inotifywait -m -r /tmp /var /etc
\`\`\`

⚠️ **NEVER run suspicious code on production systems.** Use isolated VMs with snapshots. If you have code you'd like me to analyze, paste it and I'll audit it from a security perspective.

*I don't write malware. I dissect it. There's a difference.*`,
  },
];

// ── Response generator ──

function generateResponse(message: string): string {
  // 1. Security guardrails first
  const blocked = isBlockedRequest(message);
  if (blocked) return blocked;

  // 2. Check if it's a raw command to explain
  const cmd = detectCommand(message);
  if (cmd && message.trim().includes(" ")) {
    return buildCommandResponse(message, cmd);
  }

  // 3. Build live context
  const radarCtx = getRadarContext();

  // 4. Match against knowledge base
  for (const entry of responses) {
    if (entry.patterns.some((p) => p.test(message))) {
      return entry.reply(radarCtx);
    }
  }

  // 5. Default catch-all
  return `Hmm, let me \`grep -r\` through my knowledge base for that...

I don't have a specific response for this query, but here's what I'd recommend:

1. **Shell Anatomy** — paste any command for a visual breakdown
2. **Binary Intel** — look up any binary or package
3. **Cheatsheets** — Linux, Python, Windows quick references
4. **Release Radar** — check for CVEs and version updates

Try asking about a specific topic:
\`\`\`
$ bash --topics
  nmap, firewalls, passwords, SIEM/logs, Linux, incident-response,
  CVEs/patches, community, articles, malware-analysis, hardening
\`\`\`

Or just paste a shell command and I'll break it down for you. I'm better when you're specific — think of me as \`grep\`, not \`cat /dev/random\`.`;
}

// ── API handler ──

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const reply = generateResponse(message);

    // Persist conversation for logged-in users
    const user = await getCurrentUser().catch(() => null);
    if (user) {
      try {
        const db = getDb();
        const insert = db.prepare(
          "INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)"
        );
        insert.run(user.id, "user", message.trim());
        insert.run(user.id, "assistant", reply);
      } catch {
        // Don't fail the response if persistence fails
      }
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
