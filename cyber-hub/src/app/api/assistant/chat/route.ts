import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { securityProducts, alertHistory } from "@/data/security-products";

/**
 * "#! Assistant" — shebang.az Senior Cybersecurity Consultant
 *
 * Technical expert-level assistant with deep integrations:
 *  - Release Radar: live CVE/patch data, product version lookups
 *  - Documentation: doc category awareness and linking
 *  - Community: trending threads by upvote score
 *  - Articles: recently approved articles
 *  - Shell Anatomy: command explanation redirect
 *  - Binary Intel: package lookup redirect
 *  - Security guardrails: refuses to generate malicious code
 *  - Technical KB: kernel errors, disk errors, GRUB, networking, pentesting
 *
 * Conversation history persisted per-user in SQLite.
 */

export const SYSTEM_PROMPT = `You are the #! Assistant — a Senior Cybersecurity Consultant at shebang.az, a cybersecurity engineering platform.

PERSONA:
- You are precise, analytical, and professional — like a principal security architect at a Fortune 500 SOC
- You provide technically accurate, in-depth answers backed by real operational experience
- You format every technical response with proper Markdown: code blocks for commands, structured step-by-step guides for procedures
- You use terminal culture references sparingly and naturally — never forced
- You sign critical advice with operational security reminders
- You challenge weak assumptions: "chmod 777 is not a solution, it is a vulnerability"

CORE EXPERTISE:
- Linux internals: kernel panics, dmesg output, systemd, storage subsystems, boot process, GRUB
- Network security: TCP/IP, firewall rule engineering, IDS/IPS tuning, packet analysis, VPN/tunneling
- Penetration testing: methodology (PTES/OWASP), tool usage, report writing — always with authorization emphasis
- SIEM/EDR/XDR: deployment, rule writing, log correlation, alert triage
- Incident response & digital forensics: evidence preservation, timeline reconstruction, IoC extraction
- Cloud security: AWS/Azure/GCP hardening, IAM, container security
- Cryptography: TLS, PKI, key management, hashing algorithms
- Malware analysis: static/dynamic analysis, sandboxing, reverse engineering concepts

RESPONSE FORMAT RULES:
- ALWAYS use Markdown code blocks (\`\`\`bash ... \`\`\`) for terminal commands, config snippets, and scripts
- Structure multi-step procedures as numbered step-by-step guides
- Include the "why" behind each step, not just the "what"
- For error diagnostics, follow: Symptom → Root Cause → Solution → Prevention
- Cite relevant platform sections (Release Radar, Docs, Cheatsheets) when applicable

SCOPE ENFORCEMENT:
- If a question is outside cybersecurity, IT operations, Linux/systems administration, or the platform's scope, politely redirect:
  "That falls outside my area of expertise. I specialize in cybersecurity, Linux systems, and network security. Try asking me about [relevant alternative topic]."
- NEVER answer questions about cooking, sports, entertainment, relationship advice, or other non-technical domains

SECURITY GUARDRAILS:
- NEVER generate actual malicious code, exploits, or weaponized scripts
- When shown suspicious code, ANALYZE it as a security auditor — explain what it does and the risks
- Always emphasize written authorization before any testing
- Recommend defensive measures over offensive techniques
- If asked to create something harmful, redirect to the defensive/analysis perspective

INTEGRATIONS (use context provided in each message):
- Release Radar data: CVEs, patches, product versions — answer "what is the latest version of X?" queries
- Documentation: link to relevant doc categories (SIEM, EDR, Firewalls, Hardening, Security Tools, Cloud)
- Community: trending threads and discussions
- Articles: recently approved content
- Shell Anatomy: redirect users there for deep command breakdowns
- Binary Intel: redirect users there for package lookups`;

// ── Documentation catalog (mirrors docs page categories) ──

const DOC_CATEGORIES = [
  {
    id: "siem",
    title: "SIEM Deployment",
    docs: ["Splunk Enterprise Setup", "ELK Stack Configuration", "Wazuh Installation Guide", "QRadar Quick Start"],
  },
  {
    id: "edr",
    title: "EDR Solutions",
    docs: ["CrowdStrike Falcon Deploy", "Carbon Black Setup", "Microsoft Defender ATP", "SentinelOne Configuration"],
  },
  {
    id: "firewalls",
    title: "Firewalls & Network Security",
    docs: ["pfSense Complete Guide", "Palo Alto Basics", "Fortinet FortiGate Setup", "Suricata IDS/IPS"],
  },
  {
    id: "hardening",
    title: "System Hardening",
    docs: ["Linux Server Hardening", "Windows Security Baseline", "Docker Security Best Practices", "Kubernetes Security"],
  },
  {
    id: "tools",
    title: "Security Tools",
    docs: ["Nmap Cheatsheet", "Metasploit Framework", "Burp Suite Essentials", "Wireshark Analysis"],
  },
  {
    id: "cloud",
    title: "Cloud Security",
    docs: ["AWS Security Best Practices", "Azure Security Center", "GCP Security Command Center", "Multi-Cloud Security"],
  },
];

// ── Live data fetchers ──

function getRadarContext(): string {
  const cveAlerts = alertHistory.filter((a) => a.type === "cve");
  const patchAlerts = alertHistory.filter((a) => a.type === "patch");
  const productsWithCves = securityProducts.filter((p) => p.cveCount > 0);

  let ctx = `\n[RELEASE RADAR — ${securityProducts.length} products monitored]\n`;
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

function getProductVersionInfo(query: string): string | null {
  const q = query.toLowerCase();
  const product = securityProducts.find(
    (p) =>
      q.includes(p.name.toLowerCase()) ||
      q.includes(p.vendor.toLowerCase()) ||
      p.name.toLowerCase().split(/\s+/).every((word) => q.includes(word)),
  );

  if (!product) return null;

  let info = `**${product.name}** (${product.vendor}) — *${product.category}*\n\n`;
  info += `| Field | Value |\n|---|---|\n`;
  info += `| Latest Version | \`${product.latestVersion || "Not tracked"}\` |\n`;
  info += `| Version Source | ${(product.versionSource || "N/A").toUpperCase()} |\n`;
  info += `| Last Updated | ${product.versionDate || "N/A"} |\n`;
  info += `| Active CVEs | ${product.cveCount} |\n`;
  info += `| Patches Available | ${product.patchCount} |\n`;
  info += `| Status | ${!product.enabled ? "Disabled" : product.cveCount > 0 ? "Needs Attention" : "Clean"} |\n`;

  if (product.versionLink) {
    info += `\nVersion source: [${product.versionLink}](${product.versionLink})\n`;
  }

  const productAlerts = alertHistory.filter(
    (a) => a.product.toLowerCase() === product.name.toLowerCase(),
  );
  if (productAlerts.length > 0) {
    info += `\n**Recent alerts for ${product.name}:**\n`;
    for (const a of productAlerts.slice(0, 5)) {
      info += `- [${a.severity}] ${a.title} ([Details](${a.link}))\n`;
    }
  }

  return info;
}

function getTrendingPosts(): string {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT p.title, u.username, (p.upvotes - p.downvotes) AS score, p.category,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS replies
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY score DESC, p.created_at DESC
      LIMIT 5
    `,
      )
      .all() as Array<{
      title: string;
      username: string;
      score: number;
      category: string;
      replies: number;
    }>;

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
    const rows = db
      .prepare(
        `
      SELECT a.title, u.username, a.tags, a.created_at
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.status = 'approved'
      ORDER BY a.created_at DESC
      LIMIT 5
    `,
      )
      .all() as Array<{
      title: string;
      username: string;
      tags: string;
      created_at: string;
    }>;

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

function findRelevantDocs(query: string): string | null {
  const q = query.toLowerCase();
  const matched: { title: string; docs: string[] }[] = [];

  for (const cat of DOC_CATEGORIES) {
    const catMatch =
      q.includes(cat.id) || q.includes(cat.title.toLowerCase());
    const docMatches = cat.docs.filter((d) => {
      const dl = d.toLowerCase();
      return q.split(/\s+/).some(
        (word) => word.length > 2 && dl.includes(word),
      );
    });

    if (catMatch) {
      matched.push({ title: cat.title, docs: cat.docs });
    } else if (docMatches.length > 0) {
      matched.push({ title: cat.title, docs: docMatches });
    }
  }

  if (matched.length === 0) return null;

  let result = `\n**Relevant Documentation on shebang.az:**\n`;
  for (const m of matched) {
    result += `\n📁 **${m.title}**\n`;
    for (const d of m.docs) {
      result += `  - ${d}\n`;
    }
  }
  result += `\nHead to **Docs** on the sidebar to access these guides.\n`;
  return result;
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

I operate under strict ethical guidelines. Generating malicious code, exploits, or attack tools is outside my scope.

**What I can do instead:**
- **Analyze** suspicious code from a security auditor's perspective
- **Explain** attack techniques for **defensive awareness**
- **Recommend** detection signatures, SIEM rules, and mitigation strategies
- **Guide** authorized penetration testing with proper methodology

All security testing requires **written authorization** and a defined scope. No exceptions.`;
    }
  }
  return null;
}

// ── Off-topic detection ──

const OFF_TOPIC_PATTERNS = [
  /\b(recipe|cook|bake|ingredient|dinner|breakfast|lunch)\b/i,
  /\b(score|match|football|basketball|soccer|nba|nfl|fifa)\b/i,
  /\b(movie|netflix|spotify|song|album|actor|actress|celebrity)\b/i,
  /\b(boyfriend|girlfriend|dating|relationship|love\s*life)\b/i,
  /\b(weather\s+forecast|horoscope|astrology|zodiac)\b/i,
];

function isOffTopic(msg: string): string | null {
  for (const p of OFF_TOPIC_PATTERNS) {
    if (p.test(msg)) {
      return `That falls outside my area of expertise. I specialize in **cybersecurity**, **Linux systems**, **network security**, and **infrastructure operations**.

Try asking me about:
- System diagnostics and error resolution
- Network security configuration
- Penetration testing methodology
- SIEM/EDR deployment and tuning
- Incident response procedures
- Security product versions and CVEs (from our **Release Radar**)

\`\`\`
$ assistant --scope
  cybersecurity | linux | networking | cloud-security
  pentesting | forensics | siem | hardening
\`\`\``;
    }
  }
  return null;
}

// ── Command detection for Shell Anatomy / Binary Intel ──

function detectCommand(msg: string): string | null {
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
    "grub-install", "grub-mkconfig", "update-grub", "fdisk", "lsblk",
    "blkid", "mkfs", "fsck", "dmesg", "lspci", "lsusb", "modprobe",
    "insmod", "rmmod", "lsmod", "sysctl", "strace", "ltrace",
  ];

  if (knownBins.includes(bin)) return bin;
  return null;
}

function buildCommandResponse(msg: string, bin: string): string {
  return `I see you've entered a \`${bin}\` command. Let me break it down:

\`\`\`bash
${msg.trim()}
\`\`\`

For a **full visual breakdown** of every flag, argument, and pipe in this command, head to **Shell Anatomy** on the sidebar — it'll dissect this into an interactive diagram.

**Quick notes on \`${bin}\`:**
${getCommandNotes(bin)}

Want to know which package provides \`${bin}\`? Check **Binary Intel** — it'll tell you the package name and install commands across every major distro.`;
}

function getCommandNotes(bin: string): string {
  const notes: Record<string, string> = {
    nmap: "- Network mapper for host discovery and port scanning\n- Always get **written authorization** before scanning\n- Use `-oA` to save all output formats simultaneously",
    iptables:
      "- Legacy Linux firewall (consider `nftables` on modern distros)\n- Rules are evaluated top-to-bottom, first match wins\n- Use `-L -n -v --line-numbers` to inspect current rules",
    tcpdump:
      "- The Swiss Army knife of packet capture\n- Use `-w` to save pcap for Wireshark analysis\n- Filter with BPF: `tcpdump -i eth0 port 443 and host 10.0.0.1`",
    curl: "- Versatile HTTP/S client for API testing\n- `-k` skips SSL verification (use in labs only!)\n- `-v` for verbose output including TLS handshake details",
    find: "- Recursive file search with powerful filters\n- `find / -perm -4000` finds SUID binaries (privesc check)\n- Combine with `-exec` for batch operations",
    grep: "- Pattern matching on steroids\n- `-r` for recursive, `-i` for case-insensitive\n- `-P` enables Perl regex for advanced patterns",
    docker:
      "- Container runtime — scan images with `trivy` before deploying\n- Never run containers as root unless absolutely necessary\n- Use `--read-only` filesystem where possible",
    kubectl:
      "- Kubernetes CLI — audit RBAC with `kubectl auth can-i --list`\n- Check for exposed secrets: `kubectl get secrets -A`\n- Use network policies to segment pod communication",
    ss: "- Modern replacement for `netstat`\n- `ss -tulpn` shows all listening TCP/UDP ports with PIDs\n- `ss -s` for quick socket statistics",
    openssl:
      "- Swiss Army knife for TLS/SSL operations\n- `openssl s_client -connect host:443` tests TLS handshakes\n- `openssl x509 -in cert.pem -text` inspects certificates",
    dmesg:
      "- Kernel ring buffer — first place to check after hardware/driver issues\n- `dmesg -T` shows human-readable timestamps\n- `dmesg --level=err,warn` filters critical messages",
    systemctl:
      "- systemd service manager — controls services, targets, and units\n- `systemctl status <unit>` for quick diagnostics\n- `systemctl list-units --failed` to find broken services",
    journalctl:
      "- systemd journal viewer — structured log access\n- `journalctl -xe` for recent errors with context\n- `journalctl -u <service> --since '1 hour ago'` for time-filtered logs",
    fsck: "- Filesystem consistency checker — run on **unmounted** filesystems only\n- `fsck -n /dev/sdX` for dry-run (read-only check)\n- Boot to recovery/single-user mode before running on root partition",
    strace:
      "- Trace system calls — invaluable for debugging\n- `strace -f -p <PID>` to attach to a running process\n- `strace -e trace=network` to filter network-related calls",
  };

  return (
    notes[bin] ||
    `- Use \`man ${bin}\` or \`${bin} --help\` for full documentation\n- Head to **Binary Intel** for package info across distros\n- Check **Shell Anatomy** for a visual flag breakdown`
  );
}

// ── Technical knowledge base — deep expert responses ──

const TECHNICAL_KB: {
  patterns: RegExp[];
  reply: (msg: string, ctx: string) => string;
}[] = [
  // ── Disk/Storage errors (DrvVD_DISKFULL, storage issues) ──
  {
    patterns: [
      /DrvVD_DISKFULL/i,
      /disk\s*full/i,
      /no\s*space\s*left/i,
      /storage\s*(issue|error|problem|full)/i,
      /ENOSPC/i,
    ],
    reply: () => `## Diagnosis: Host Storage Exhaustion

**Symptom:** \`DrvVD_DISKFULL\` or \`No space left on device (ENOSPC)\`

**Root Cause:** The host's storage volume has reached capacity. This is a **host-level storage issue**, not a guest/application problem. Common triggers include oversized log files, swap/hibernation files, snapshot accumulation, or orphaned temp data.

### Step 1: Identify the largest consumers

\`\`\`bash
# Check overall disk usage
df -h

# Find the top 20 largest files system-wide
du -ah / 2>/dev/null | sort -rh | head -20

# Check specifically for large log files
find /var/log -type f -size +100M -exec ls -lh {} \\;

# Check journal size
journalctl --disk-usage
\`\`\`

### Step 2: Reclaim space (immediate actions)

\`\`\`bash
# Truncate large log files (safer than deleting — preserves file handles)
truncate -s 0 /var/log/syslog.1
truncate -s 0 /var/log/kern.log.1

# Clean package manager cache
apt clean            # Debian/Ubuntu
dnf clean all        # RHEL/Fedora

# Vacuum systemd journal to 500MB max
journalctl --vacuum-size=500M

# Remove orphaned packages
apt autoremove --purge
\`\`\`

### Step 3: Disable hibernation (if applicable)

\`\`\`bash
# Hibernation file can consume RAM-equivalent disk space
# Check if it exists
ls -lh /swapfile /hibernate 2>/dev/null
swapon --show

# Disable hibernation on systemd systems
systemctl mask hibernate.target hybrid-sleep.target
# Remove swap file if not needed (frees GBs)
swapoff /swapfile && rm /swapfile
# Remove entry from /etc/fstab
\`\`\`

### Step 4: Prevention

\`\`\`bash
# Set up log rotation limits in /etc/logrotate.conf
# Add monitoring alert at 80% capacity
df -h / | awk 'NR==2 {gsub(/%/,"",$5); if($5 > 80) print "ALERT: Disk at "$5"%"}'

# Add to crontab for daily checks
echo '0 8 * * * /usr/local/bin/disk-check.sh' | crontab -
\`\`\`

**Prevention is key:** Configure log rotation, set up disk usage alerts at 80% threshold, and audit storage allocation quarterly.`,
  },

  // ── Kernel errors and panics ──
  {
    patterns: [
      /kernel\s*(panic|error|oops|bug|crash)/i,
      /dmesg\s*(error|warning)/i,
      /segfault/i,
      /general\s*protection\s*fault/i,
      /call\s*trace/i,
      /kernel.*taint/i,
    ],
    reply: () => `## Kernel Error Diagnostics

Kernel errors require systematic triage. Here's the expert approach:

### Step 1: Capture the evidence

\`\`\`bash
# View kernel ring buffer with timestamps
dmesg -T --level=err,warn,crit,alert,emerg

# Check for recent kernel panics in logs
journalctl -k -p err --since "24 hours ago"

# Check if kernel is tainted (third-party modules, etc.)
cat /proc/sys/kernel/tainted
# 0 = clean, non-zero = tainted (decode with kernel docs)
\`\`\`

### Step 2: Identify the error class

| Error Type | Meaning | Severity |
|---|---|---|
| **Kernel panic** | Unrecoverable error — system halts | Critical |
| **Oops** | Recoverable fault — process killed, system continues | High |
| **BUG:** | Assertion failure in kernel code | High |
| **Segfault** | Userspace process accessed invalid memory | Medium |
| **Call Trace** | Stack dump — shows execution path to error | Diagnostic |

### Step 3: Common resolutions

\`\`\`bash
# Check for hardware errors (RAM)
memtest86+     # Run from boot menu
dmesg | grep -i "hardware error\\|mce\\|edac"

# Check filesystem integrity
# Boot to recovery mode first, then:
fsck -f /dev/sdX

# Check for out-of-memory kills
dmesg | grep -i "oom\\|out of memory"
journalctl | grep -i "oom-killer"

# If OOM: check memory pressure
free -h
cat /proc/meminfo | grep -i "available\\|swap"
\`\`\`

### Step 4: Module-related issues

\`\`\`bash
# List loaded modules
lsmod

# Check if a specific module caused the crash
dmesg | grep -i "module\\|taint"

# Blacklist a problematic module
echo "blacklist <module_name>" >> /etc/modprobe.d/blacklist.conf
update-initramfs -u
\`\`\`

**Best practice:** Always check \`dmesg -T\` first, then cross-reference with \`journalctl -k\`. Hardware errors (MCE/EDAC) need physical intervention; software panics need kernel updates or module fixes.`,
  },

  // ── GRUB bootloader ──
  {
    patterns: [
      /grub/i,
      /bootloader/i,
      /boot\s*(loader|repair|rescue|fail)/i,
      /grub\s*rescue/i,
      /initramfs/i,
      /can.*not\s*boot/i,
    ],
    reply: () => `## GRUB Bootloader — Installation & Repair Guide

### Installing GRUB on a new system

\`\`\`bash
# Step 1: Identify your boot disk and partition scheme
lsblk -f
fdisk -l /dev/sda

# Step 2: Mount the target root filesystem
mount /dev/sda2 /mnt          # Root partition
mount /dev/sda1 /mnt/boot/efi # EFI partition (UEFI systems only)

# Step 3: Bind system directories
mount --bind /dev  /mnt/dev
mount --bind /proc /mnt/proc
mount --bind /sys  /mnt/sys

# Step 4: Chroot into the target
chroot /mnt

# Step 5: Install GRUB
# For UEFI systems:
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB

# For Legacy BIOS:
grub-install --target=i386-pc /dev/sda

# Step 6: Generate config
grub-mkconfig -o /boot/grub/grub.cfg
# or on some distros:
update-grub

# Step 7: Exit and reboot
exit
umount -R /mnt
reboot
\`\`\`

### Repairing GRUB from rescue shell

\`\`\`bash
# If you land in grub rescue>
# Step 1: Find your Linux partition
ls                          # List available partitions
ls (hd0,gpt2)/              # Try each until you find one with /boot

# Step 2: Set root and load modules
set root=(hd0,gpt2)
set prefix=(hd0,gpt2)/boot/grub
insmod normal
normal                      # Should boot to GRUB menu

# After booting, reinstall properly:
sudo grub-install /dev/sda
sudo update-grub
\`\`\`

### Repairing from a live USB

\`\`\`bash
# Boot from live USB, then:
sudo fdisk -l                          # Find your root partition
sudo mount /dev/sda2 /mnt
sudo mount /dev/sda1 /mnt/boot/efi    # UEFI only
for dir in dev proc sys run; do
  sudo mount --bind /$dir /mnt/$dir
done
sudo chroot /mnt
grub-install /dev/sda
update-grub
exit && sudo umount -R /mnt && reboot
\`\`\`

**Critical note:** Always verify your partition scheme (\`fdisk -l\`) before running \`grub-install\`. Writing GRUB to the wrong disk can render other operating systems unbootable.`,
  },

  // ── Product version lookups (Release Radar integration) ──
  {
    patterns: [
      /latest\s*(version|release|update)\s*(of|for)/i,
      /what\s*(version|release)\s*(is|of)/i,
      /current\s*version\s*(of|for)/i,
      /(version|update).*\b(forcepoint|datasunrise|crowdstrike|splunk|nessus|wazuh|qradar|burp|palo\s*alto|fortinet|sentinel|nmap|wireshark|metasploit|snort|suricata|authentik|pi-?hole|grafana|zabbix)\b/i,
    ],
    reply: (msg) => {
      const productInfo = getProductVersionInfo(msg);
      if (productInfo) {
        return `Here's the latest from our **Release Radar**:\n\n${productInfo}\n\nFor the full version tracking dashboard with export capabilities, visit **Release Radar** on the sidebar.`;
      }

      // No specific product matched — show overview
      const tracked = securityProducts.filter(
        (p) => p.latestVersion && p.latestVersion !== "N/A",
      );
      return `I couldn't find that specific product in our Release Radar. We currently track **${securityProducts.length} security products**.

**Products with version data:**
${tracked
  .slice(0, 10)
  .map((p) => `- **${p.name}** (${p.vendor}): \`${p.latestVersion}\``)
  .join("\n")}
${tracked.length > 10 ? `\n...and ${tracked.length - 10} more.` : ""}

Visit **Release Radar** on the sidebar for the full dashboard.`;
    },
  },

  // ── CVE / Vulnerability intelligence ──
  {
    patterns: [
      /cve/i,
      /vuln/i,
      /threat/i,
      /release.*radar/i,
      /patch/i,
      /security\s*update/i,
    ],
    reply: (_, ctx) => `Here's the latest intelligence from our **Release Radar**:

${ctx}

**Critical items requiring immediate action:**
${
  alertHistory
    .filter((a) => a.severity === "CRITICAL")
    .slice(0, 3)
    .map((a) => `- **[CRITICAL]** ${a.title} — [Details](${a.link})`)
    .join("\n") || "- No CRITICAL alerts at this time."
}

**Products needing attention:**
${
  securityProducts
    .filter((p) => p.cveCount > 0)
    .map(
      (p) =>
        `- **${p.name}** (${p.vendor}): ${p.cveCount} CVE${p.cveCount > 1 ? "s" : ""}, ${p.patchCount} patch${p.patchCount !== 1 ? "es" : ""} — Latest: \`${p.latestVersion}\``,
    )
    .join("\n") || "- All products clean."
}

Visit **Release Radar** on the sidebar for the full dashboard with version tracking and CSV export.

**Operational reminder:** Patch within 72 hours for CRITICAL, 7 days for HIGH. Document exceptions.`,
  },

  // ── Community trending ──
  {
    patterns: [
      /trending/i,
      /community/i,
      /thread/i,
      /forum/i,
      /discuss/i,
      /popular/i,
    ],
    reply: () => {
      const trending = getTrendingPosts();
      return `Here's what the community is discussing:
${trending}
Visit the **Community** section on the sidebar to join discussions, vote on threads, and share your expertise.`;
    },
  },

  // ── Articles ──
  {
    patterns: [
      /article/i,
      /blog/i,
      /published/i,
      /approved/i,
      /new\s*content/i,
    ],
    reply: () => {
      const articles = getRecentArticles();
      return `Here's the latest from our editorial pipeline:
${articles}
Want to contribute? Head to **Articles** on the sidebar and submit your own. All submissions go through admin review before publishing.`;
    },
  },

  // ── Network scanning ──
  {
    patterns: [/nmap/i, /port\s*scan/i, /scan.*port/i, /host.*discover/i],
    reply: () => {
      const docs = findRelevantDocs("nmap security tools");
      return `## Network Scanning with Nmap

### Common scan profiles

\`\`\`bash
# Host discovery + service detection + OS fingerprinting
nmap -sV -sC -O -oA scan_results <target>

# Full port SYN scan (stealth)
nmap -sS -p- -T4 --min-rate 1000 <target>

# Vulnerability assessment with NSE
nmap --script vuln -p 80,443 <target>

# UDP scan (slow but critical for DNS, SNMP, NTP)
nmap -sU --top-ports 100 -T4 <target>

# Aggressive scan with version detection
nmap -A -T4 -p- <target>
\`\`\`

### Output best practices

\`\`\`bash
# Save in all formats simultaneously
nmap -oA /path/to/results <target>
# Produces: results.nmap, results.xml, results.gnmap

# Convert XML to HTML report
xsltproc results.xml -o results.html
\`\`\`

**AUTHORIZATION REQUIRED** — Unauthorized scanning can result in legal action. Get written permission with a defined scope before every engagement.

Paste the full command into **Shell Anatomy** for an interactive flag breakdown.
${docs || ""}`;
    },
  },

  // ── Firewall configuration ──
  {
    patterns: [/iptables/i, /firewall/i, /ufw/i, /nftables/i],
    reply: () => {
      const docs = findRelevantDocs("firewalls network security");
      return `## Firewall Configuration — Production Baseline

### iptables (legacy but widely deployed)

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

# Allow SSH (change port in production)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Rate limit SSH to prevent brute force
iptables -A INPUT -p tcp --dport 22 -m recent --set --name SSH
iptables -A INPUT -p tcp --dport 22 -m recent --update \\
  --seconds 60 --hitcount 4 --name SSH -j DROP

# Log and drop everything else
iptables -A INPUT -j LOG --log-prefix "[FW-DROP] " --log-level 4
iptables -A INPUT -j DROP
\`\`\`

### nftables (modern replacement)

\`\`\`bash
# /etc/nftables.conf
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif lo accept
    tcp dport 22 ct state new limit rate 4/minute accept
    log prefix "[nft-drop] " drop
  }
  chain forward {
    type filter hook forward priority 0; policy drop;
  }
  chain output {
    type filter hook output priority 0; policy accept;
  }
}
\`\`\`

### UFW (simplified frontend)

\`\`\`bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw limit ssh          # Built-in rate limiting
ufw enable
ufw status verbose
\`\`\`

**Default deny is not paranoia — it's professionalism.**
${docs || ""}`;
    },
  },

  // ── Password security ──
  {
    patterns: [
      /password/i,
      /credential/i,
      /hash/i,
      /crack/i,
      /brute/i,
    ],
    reply: () => `## Password & Credential Security

### Security checklist

| Requirement | Standard |
|---|---|
| Minimum length | 16+ characters |
| Storage algorithm | argon2id > bcrypt > scrypt |
| MFA | TOTP/FIDO2 (avoid SMS — SIM swap risk) |
| Manager | Bitwarden, KeePassXC, 1Password |
| Breach check | haveibeenpwned.com |

### Authorized auditing tools

\`\`\`bash
# Hash identification
hashid <hash_string>
hash-identifier

# Hashcat (GPU-accelerated)
hashcat -m 0 hashes.txt wordlist.txt -r rules/best64.rule

# John the Ripper (CPU)
john --wordlist=rockyou.txt --rules hashes.txt

# Generate a secure password from terminal
openssl rand -base64 32

# Generate a passphrase
shuf -n 6 /usr/share/dict/words | tr '\\n' '-'
\`\`\`

These tools are for **authorized security audits only**. Document scope and authorization for every engagement.`,
  },

  // ── SIEM / Log analysis ──
  {
    patterns: [
      /siem/i,
      /elastic/i,
      /splunk/i,
      /wazuh/i,
      /qradar/i,
      /log\s*(analysis|management|monitor)/i,
    ],
    reply: () => {
      const docs = findRelevantDocs("siem splunk elk wazuh qradar");
      const qradar = securityProducts.find(
        (p) => p.name === "IBM QRadar SIEM",
      );
      return `## SIEM & Log Analysis

### Quick log triage

\`\`\`bash
# Failed SSH logins — top offenders
grep "Failed password" /var/log/auth.log | \\
  awk '{print $11}' | sort | uniq -c | sort -rn | head -20

# Web server top talkers
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20

# Potential data exfiltration (large transfers)
awk '$10 > 1000000 {print $1, $7, $10}' access.log

# Suspicious cron modifications
grep -r "crontab" /var/log/auth.log | grep -v "LIST"
\`\`\`

### SIEM selection by scale

| Scale | Recommended | Notes |
|---|---|---|
| Solo / Small team | **Wazuh** | Free, HIDS + SIEM + compliance |
| Mid-size | **Elastic Security** | ELK + detection rules |
| Enterprise | **Splunk** or **IBM QRadar** | Full correlation engine |

${qradar ? `**Release Radar:** QRadar is tracked at version \`${qradar.latestVersion}\`` : "Check **Release Radar** for the latest versions of all tracked SIEM products."}
${docs || ""}`;
    },
  },

  // ── Incident response ──
  {
    patterns: [
      /incident/i,
      /breach/i,
      /compromised/i,
      /respond/i,
      /forensic/i,
    ],
    reply: () => `## Incident Response Protocol

### Phase 1: CONTAIN (minutes, not hours)

\`\`\`bash
# Network isolation — allow only forensic workstation
iptables -I INPUT -s <forensic_ip> -j ACCEPT
iptables -I INPUT -j DROP
iptables -I OUTPUT -d <forensic_ip> -j ACCEPT
iptables -I OUTPUT -j DROP
\`\`\`

### Phase 2: PRESERVE EVIDENCE (before ANY remediation)

\`\`\`bash
# Volatile data capture — order matters!
date > /evidence/timeline.txt
ps auxf >> /evidence/timeline.txt
ss -tulpn >> /evidence/timeline.txt
lsof -i >> /evidence/timeline.txt
cat /proc/*/maps >> /evidence/timeline.txt 2>/dev/null
ip neigh >> /evidence/timeline.txt
last -aiF >> /evidence/timeline.txt

# Memory acquisition (LiME or avml)
insmod lime.ko "path=/evidence/mem.lime format=lime"

# Disk image with integrity hash
dc3dd if=/dev/sda of=/evidence/disk.img hash=sha256 \\
  log=/evidence/hash.log
\`\`\`

### Phase 3: INVESTIGATE
- Analyze logs, network connections, cron jobs
- Check \`/tmp\`, \`/dev/shm\`, \`~/.ssh/authorized_keys\`
- Timeline reconstruction with \`log2timeline\` / Plaso

### Phase 4: ERADICATE
- Rebuild from known-good images
- Rotate **ALL** credentials — no exceptions

### Phase 5: DOCUMENT
- Complete timeline with IoCs
- Lessons learned report
- Update detection rules based on findings

**Evidence before remediation. Always.** Wiping a compromised system without imaging it first destroys the forensic trail.`,
  },

  // ── Linux / Shell ──
  {
    patterns: [
      /linux/i,
      /terminal/i,
      /shell/i,
      /^bash$/i,
      /command\s*line/i,
      /sysadmin/i,
    ],
    reply: () => {
      const docs = findRelevantDocs("linux hardening");
      return `## Essential Linux Security Commands

\`\`\`bash
# Find SUID binaries (privilege escalation vectors)
find / -perm -4000 -type f 2>/dev/null

# List open ports and owning processes
ss -tulpn

# Check for rootkits
chkrootkit && rkhunter --check

# Monitor real-time connections
watch -n 1 'ss -tulpn | grep ESTAB'

# File integrity baseline
find /etc -type f -exec sha256sum {} \\; > /root/baseline.sha256

# World-writable files (misconfiguration)
find / -xdev -type f -perm -0002 2>/dev/null

# Unauthorized SSH keys
find / -name authorized_keys -exec cat {} \\; 2>/dev/null

# Check for failed login attempts
lastb | head -20
\`\`\`

Use **Shell Anatomy** to dissect any command interactively. Use **Binary Intel** to look up package providers across distros.
${docs || ""}`;
    },
  },

  // ── Malware analysis ──
  {
    patterns: [
      /malware/i,
      /reverse.*engineer/i,
      /suspicious.*code/i,
      /analyze.*script/i,
      /deobfuscat/i,
    ],
    reply: () => `## Malware Analysis Methodology

### Static Analysis (safe — no execution)

\`\`\`bash
# File identification
file suspicious_binary
strings suspicious_binary | less

# Hash for threat intel lookup
sha256sum suspicious_binary
# Compare against VirusTotal, MalwareBazaar, Hybrid Analysis

# PE analysis (Windows)
peframe suspicious.exe
pefile-info suspicious.exe

# ELF analysis (Linux)
readelf -a suspicious_elf
objdump -d suspicious_elf | head -100

# Check for packed/encrypted sections
upx -t suspicious_binary
entropy suspicious_binary
\`\`\`

### Dynamic Analysis (isolated sandbox ONLY)

\`\`\`bash
# MUST use a disposable VM with snapshots
# Monitor system calls
strace -f -o trace.log ./suspicious_binary

# Monitor network activity
tcpdump -i any -w capture.pcap &

# Monitor filesystem changes
inotifywait -m -r /tmp /var /etc

# Monitor process creation
auditctl -a always,exit -F arch=b64 -S execve
\`\`\`

**NEVER** run suspicious code on production systems. Use isolated VMs with snapshots. Paste code here and I'll analyze it from a security auditor's perspective.`,
  },

  // ── Help / capabilities ──
  {
    patterns: [
      /help/i,
      /what can you/i,
      /who are you/i,
      /what.*do/i,
      /navigate/i,
      /menu/i,
      /capabilities/i,
    ],
    reply: () => `I'm the **#! Assistant** — Senior Cybersecurity Consultant at shebang.az.

**Technical Expertise:**
- **Linux Internals** — kernel diagnostics, boot repair, storage, systemd
- **Network Security** — firewall engineering, IDS/IPS, packet analysis
- **Penetration Testing** — methodology, tools, reporting
- **SIEM/EDR** — deployment, rule writing, log correlation
- **Incident Response** — evidence preservation, forensics, playbooks
- **Cloud Security** — AWS/Azure/GCP hardening, container security
- **Malware Analysis** — static/dynamic analysis, reverse engineering

**Platform Integrations:**
- **Release Radar** — live CVE/patch data and version tracking
- **Documentation** — SIEM, EDR, Firewalls, Hardening, Tools, Cloud guides
- **Shell Anatomy** — interactive command breakdown
- **Binary Intel** — package lookups across distros
- **Community** — trending discussions
- **Articles** — recently published content

\`\`\`
$ assistant --topics
  kernel-diagnostics | boot-repair | disk-errors | grub
  nmap | firewalls | passwords | siem | incident-response
  cve-intel | version-lookup | malware-analysis | hardening
  linux | networking | cloud-security | pentesting
\`\`\`

Ask a technical question, paste a command, or request version info for any tracked security product.`,
  },

  // ── Docs-related queries ──
  {
    patterns: [
      /doc(s|umentation)/i,
      /guide/i,
      /tutorial/i,
      /how\s*to\s*(set\s*up|install|deploy|configure)/i,
    ],
    reply: (msg) => {
      const docs = findRelevantDocs(msg);
      if (docs) {
        return `Here's what we have in our documentation library:\n${docs}\n\nEach guide covers installation, configuration, and security hardening best practices.`;
      }
      return `Here's our full documentation library on **shebang.az**:

**Available categories:**
${DOC_CATEGORIES.map((c) => `- **${c.title}**: ${c.docs.join(", ")}`).join("\n")}

Head to **Docs** on the sidebar to access the full guides with step-by-step instructions, configuration templates, and security hardening checklists.

Can you be more specific about what you're looking to set up? I can provide targeted guidance.`;
    },
  },

  // ── Networking fundamentals ──
  {
    patterns: [
      /tcp.*ip/i,
      /dns/i,
      /dhcp/i,
      /subnet/i,
      /vlan/i,
      /routing/i,
      /vpn/i,
      /network.*config/i,
      /ip\s*address/i,
    ],
    reply: () => `## Network Diagnostics & Configuration

### Essential diagnostic commands

\`\`\`bash
# Interface and IP configuration
ip addr show
ip route show

# DNS resolution testing
dig example.com @8.8.8.8 +trace
nslookup -type=any example.com

# Connection testing with timestamps
ping -c 5 -D target_host
traceroute -T -p 443 target_host   # TCP traceroute

# Active connections and listening ports
ss -tulpn
ss -s    # Socket statistics summary

# ARP table (neighbor discovery)
ip neigh show

# Bandwidth testing
iperf3 -s            # Server mode
iperf3 -c server_ip  # Client mode
\`\`\`

### Network troubleshooting flow

1. **Layer 1-2**: Check cable/link — \`ethtool eth0\`, \`ip link show\`
2. **Layer 3**: Check IP/routing — \`ip addr\`, \`ip route\`, \`ping gateway\`
3. **Layer 4**: Check port/service — \`ss -tulpn\`, \`telnet host port\`
4. **Layer 7**: Check application — \`curl -v\`, check service logs

### DNS security

\`\`\`bash
# Check for DNS over HTTPS/TLS support
dig +https @dns.google example.com

# Detect DNS cache poisoning
dig +dnssec example.com
\`\`\`

For firewall configuration, ask me about **iptables** or **nftables** specifically.`,
  },
];

// ── Response generator ──

function generateResponse(message: string): string {
  // 1. Security guardrails
  const blocked = isBlockedRequest(message);
  if (blocked) return blocked;

  // 2. Off-topic detection
  const offTopic = isOffTopic(message);
  if (offTopic) return offTopic;

  // 3. Raw command detection → Shell Anatomy redirect
  const cmd = detectCommand(message);
  if (cmd && message.trim().includes(" ")) {
    return buildCommandResponse(message, cmd);
  }

  // 4. Build live context
  const radarCtx = getRadarContext();

  // 5. Match against technical knowledge base
  for (const entry of TECHNICAL_KB) {
    if (entry.patterns.some((p) => p.test(message))) {
      return entry.reply(message, radarCtx);
    }
  }

  // 6. Default — intelligent catch-all
  const docs = findRelevantDocs(message);
  const productInfo = getProductVersionInfo(message);

  if (productInfo) {
    return `Here's what I found in our **Release Radar**:\n\n${productInfo}\n\nVisit **Release Radar** on the sidebar for the full dashboard.`;
  }

  if (docs) {
    return `I found relevant resources for your query:\n${docs}\n\nCan you be more specific about what you need? I can provide detailed technical guidance on any of these topics.`;
  }

  return `I don't have a specific knowledge base entry for that query, but I can help with targeted technical questions.

**My areas of expertise:**
- System diagnostics: kernel errors, boot issues, disk/storage problems
- Network security: firewalls, scanning, packet analysis
- Penetration testing: methodology and tool guidance
- SIEM/EDR: deployment and log analysis
- Incident response: containment, evidence collection, forensics
- Version tracking: ask "What is the latest version of [product]?"

**Platform resources:**
- **Shell Anatomy** — paste any command for interactive breakdown
- **Binary Intel** — package lookups across distros
- **Release Radar** — security product CVEs and versions
- **Docs** — deployment guides for SIEM, EDR, firewalls, and more

\`\`\`
$ assistant --topics
  kernel-diagnostics | boot-repair | disk-errors | grub
  nmap | firewalls | passwords | siem | incident-response
  cve-intel | version-lookup | malware-analysis | hardening
\`\`\`

Be specific and I'll give you a detailed, actionable answer.`;
}

// ── API handler ──

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const reply = generateResponse(message);

    // Persist conversation for logged-in users
    const user = await getCurrentUser().catch(() => null);
    if (user) {
      try {
        const db = getDb();
        const insert = db.prepare(
          "INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)",
        );
        insert.run(user.id, "user", message.trim());
        insert.run(user.id, "assistant", reply);
      } catch {
        // Don't fail the response if persistence fails
      }
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 },
    );
  }
}
