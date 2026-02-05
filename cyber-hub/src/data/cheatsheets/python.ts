export const pythonCheatsheet = {
  id: "python",
  title: "Python Security & Automation",
  icon: "code",
  color: "cyber-secondary",
  description: "Python scripts for networking, automation, and security tasks",
  lastUpdated: "2024-01-15",
  sections: [
    {
      title: "Network Scanning",
      code: `#!/usr/bin/env python3
"""Basic port scanner using sockets"""
import socket
from concurrent.futures import ThreadPoolExecutor

def scan_port(host, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            return port
    except:
        pass
    return None

def scan_host(host, ports=range(1, 1025)):
    print(f"[*] Scanning {host}")
    open_ports = []
    with ThreadPoolExecutor(max_workers=100) as executor:
        results = executor.map(lambda p: scan_port(host, p), ports)
        open_ports = [p for p in results if p]
    return open_ports

# Usage
if __name__ == "__main__":
    target = "192.168.1.1"
    ports = scan_host(target)
    print(f"[+] Open ports: {ports}")`,
    },
    {
      title: "HTTP Requests & Web Scraping",
      code: `#!/usr/bin/env python3
"""HTTP requests for recon and testing"""
import requests
from urllib.parse import urljoin

# Basic GET request
def fetch_url(url):
    try:
        resp = requests.get(url, timeout=10, verify=False)
        return {
            'status': resp.status_code,
            'headers': dict(resp.headers),
            'content': resp.text[:500]
        }
    except requests.RequestException as e:
        return {'error': str(e)}

# Directory bruteforce
def dir_brute(base_url, wordlist):
    found = []
    with open(wordlist, 'r') as f:
        for word in f:
            url = urljoin(base_url, word.strip())
            try:
                r = requests.head(url, timeout=5)
                if r.status_code < 400:
                    found.append((url, r.status_code))
                    print(f"[+] {r.status_code} - {url}")
            except:
                pass
    return found

# POST with custom headers
def post_data(url, data, headers=None):
    default_headers = {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    if headers:
        default_headers.update(headers)
    return requests.post(url, data=data, headers=default_headers)`,
    },
    {
      title: "Password & Hash Utilities",
      code: `#!/usr/bin/env python3
"""Password and hash utilities"""
import hashlib
import base64
import secrets
import string

def hash_password(password, algo='sha256'):
    """Generate hash of password"""
    algos = {
        'md5': hashlib.md5,
        'sha1': hashlib.sha1,
        'sha256': hashlib.sha256,
        'sha512': hashlib.sha512
    }
    return algos[algo](password.encode()).hexdigest()

def generate_password(length=16):
    """Generate secure random password"""
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(chars) for _ in range(length))

def base64_encode(data):
    return base64.b64encode(data.encode()).decode()

def base64_decode(data):
    return base64.b64decode(data).decode()

# Dictionary attack
def crack_hash(target_hash, wordlist, algo='sha256'):
    with open(wordlist, 'r', errors='ignore') as f:
        for word in f:
            word = word.strip()
            if hash_password(word, algo) == target_hash:
                return word
    return None

# Usage
print(hash_password("password123", "sha256"))
print(generate_password(20))`,
    },
    {
      title: "File Operations & Forensics",
      code: `#!/usr/bin/env python3
"""File analysis and forensics utilities"""
import os
import hashlib
from pathlib import Path

def file_hash(filepath, algo='sha256'):
    """Calculate file hash"""
    h = hashlib.new(algo)
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            h.update(chunk)
    return h.hexdigest()

def find_files(directory, extension=None, min_size=0):
    """Find files by extension and size"""
    results = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            if extension and not file.endswith(extension):
                continue
            try:
                size = os.path.getsize(filepath)
                if size >= min_size:
                    results.append({
                        'path': filepath,
                        'size': size,
                        'hash': file_hash(filepath)
                    })
            except:
                pass
    return results

def extract_strings(filepath, min_length=4):
    """Extract printable strings from binary"""
    with open(filepath, 'rb') as f:
        data = f.read()
    result = []
    current = []
    for byte in data:
        if 32 <= byte < 127:
            current.append(chr(byte))
        else:
            if len(current) >= min_length:
                result.append(''.join(current))
            current = []
    return result`,
    },
    {
      title: "Subprocess & Command Execution",
      code: `#!/usr/bin/env python3
"""Safe command execution utilities"""
import subprocess
import shlex

def run_command(cmd, timeout=30):
    """Run shell command safely"""
    try:
        result = subprocess.run(
            shlex.split(cmd),
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return {
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {'error': 'Command timed out'}
    except Exception as e:
        return {'error': str(e)}

def run_commands(commands):
    """Run multiple commands"""
    results = []
    for cmd in commands:
        results.append({
            'command': cmd,
            'result': run_command(cmd)
        })
    return results

# Pipe commands
def pipe_commands(cmd1, cmd2):
    """Pipe output from cmd1 to cmd2"""
    p1 = subprocess.Popen(shlex.split(cmd1), stdout=subprocess.PIPE)
    p2 = subprocess.Popen(shlex.split(cmd2), stdin=p1.stdout, stdout=subprocess.PIPE)
    p1.stdout.close()
    return p2.communicate()[0].decode()

# Usage
print(run_command("ls -la"))`,
    },
    {
      title: "Socket Programming",
      code: `#!/usr/bin/env python3
"""Socket utilities for network operations"""
import socket

def tcp_client(host, port, data):
    """Simple TCP client"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((host, port))
        s.sendall(data.encode())
        response = s.recv(4096)
    return response.decode()

def tcp_server(host, port, handler):
    """Simple TCP server"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((host, port))
        s.listen(5)
        print(f"[*] Listening on {host}:{port}")
        while True:
            client, addr = s.accept()
            print(f"[+] Connection from {addr}")
            handler(client)

def banner_grab(host, port):
    """Grab service banner"""
    try:
        s = socket.socket()
        s.settimeout(5)
        s.connect((host, port))
        s.send(b"\\r\\n")
        banner = s.recv(1024)
        s.close()
        return banner.decode().strip()
    except:
        return None

def dns_lookup(hostname):
    """DNS resolution"""
    try:
        return socket.gethostbyname(hostname)
    except socket.gaierror:
        return None`,
    },
    {
      title: "Logging & Color Output",
      code: `#!/usr/bin/env python3
"""Logging utilities for scripts"""
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scan.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Color output
class Colors:
    RED = '\\033[91m'
    GREEN = '\\033[92m'
    YELLOW = '\\033[93m'
    BLUE = '\\033[94m'
    RESET = '\\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}[+] {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}[-] {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}[*] {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}[!] {msg}{Colors.RESET}")

# Usage
logger.info("Starting scan...")
print_success("Port 22 is open")
print_error("Connection refused")`,
    },
  ],
};
