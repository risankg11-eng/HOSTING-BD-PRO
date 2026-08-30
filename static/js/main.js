/* ==========================================================================
   AONIK — CLIENT-SIDE JAVASCRIPT ENGINE
   ========================================================================== */

// Global Toast System
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'danger') icon = '✕';
  if (type === 'warning') icon = '⚠';

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: bold; font-size: 1.1rem;">${icon}</span>
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #94A3B8; margin-left: 12px;">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Global Dropdown Handler
let activeDropdownTrigger = null;
let activeDropdownPopover = null;

function positionDropdown(trigger, popover) {
  if (!trigger || !popover) return;
  
  // Set fixed styling
  popover.style.position = 'fixed';
  popover.style.zIndex = '999999';
  popover.style.display = 'block';
  
  const rect = trigger.getBoundingClientRect();
  const popoverWidth = popover.offsetWidth || 180;
  const popoverHeight = popover.offsetHeight || 190;
  
  // X Positioning: Align to the right of the trigger button, keep inside viewport
  let left = rect.right - popoverWidth;
  if (left < 10) {
    left = 10;
  }
  if (left + popoverWidth > window.innerWidth - 10) {
    left = window.innerWidth - popoverWidth - 10;
  }
  
  // Y Positioning: Show below trigger, or above if it overflows bottom viewport
  let top = rect.bottom + 4;
  if (top + popoverHeight > window.innerHeight - 10) {
    top = rect.top - popoverHeight - 4;
  }
  if (top < 10) {
    top = 10;
  }
  
  popover.style.left = left + 'px';
  popover.style.top = top + 'px';
  popover.style.right = 'auto';
  popover.style.marginTop = '0px';
}

function closeAllDropdowns() {
  const allPopovers = document.querySelectorAll('.dropdown-popover');
  const allWrappers = document.querySelectorAll('.dropdown-menu-wrapper');
  const allRows = document.querySelectorAll('.file-list-item');
  
  allPopovers.forEach(p => {
    p.classList.remove('show');
    p.style.display = 'none';
  });
  allWrappers.forEach(w => w.classList.remove('is-open'));
  allRows.forEach(r => r.classList.remove('has-open-dropdown'));
  
  activeDropdownTrigger = null;
  activeDropdownPopover = null;
}

function updateActiveDropdownPosition() {
  if (activeDropdownTrigger && activeDropdownPopover) {
    const rect = activeDropdownTrigger.getBoundingClientRect();
    if (rect.top < -50 || rect.bottom > window.innerHeight + 50) {
      closeAllDropdowns();
      return;
    }
    positionDropdown(activeDropdownTrigger, activeDropdownPopover);
  }
}

// Ensure it handles scroll inside any scrollable container (use capture = true)
window.addEventListener('scroll', updateActiveDropdownPosition, { passive: true, capture: true });
window.addEventListener('resize', updateActiveDropdownPosition, { passive: true });

document.addEventListener('click', function (e) {
  const trigger = e.target.closest('.dropdown-trigger');
  
  if (trigger) {
    e.stopPropagation();
    const targetPopover = trigger.nextElementSibling;
    const parentWrapper = trigger.closest('.dropdown-menu-wrapper');
    const parentRow = trigger.closest('.file-list-item');
    const isShown = targetPopover && targetPopover.classList.contains('show');
    
    // Close others
    closeAllDropdowns();
    
    if (targetPopover && !isShown) {
      targetPopover.classList.add('show');
      if (parentWrapper) parentWrapper.classList.add('is-open');
      if (parentRow) parentRow.classList.add('has-open-dropdown');
      
      activeDropdownTrigger = trigger;
      activeDropdownPopover = targetPopover;
      positionDropdown(trigger, targetPopover);
    }
  } else {
    if (!e.target.closest('.dropdown-popover')) {
      closeAllDropdowns();
    }
  }
});

// Daily Coin Claim
async function claimDailyCoins() {
  const claimBtn = document.getElementById('claim-daily-btn');
  if (!claimBtn) return;

  claimBtn.disabled = true;
  claimBtn.innerHTML = 'Claiming...';

  try {
    const res = await fetch('/api/coins/claim-daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      // Update coin indicators in UI
      document.querySelectorAll('.user-coin-val').forEach(el => {
        el.textContent = data.new_balance;
      });
      claimBtn.innerHTML = 'Next claim available at 12:00 AM';
      claimBtn.classList.remove('btn-primary');
      claimBtn.style.background = '#F1F5F9';
      claimBtn.style.color = '#94A3B8';
      claimBtn.style.border = '1px solid #E2E8F0';
      claimBtn.disabled = true;
      setTimeout(() => location.reload(), 1500);
    } else {
      showToast(data.message, 'warning');
      claimBtn.disabled = false;
      claimBtn.innerHTML = 'Claim Daily Coins';
    }
  } catch (err) {
    showToast('Failed to claim daily coins. Try again later.', 'danger');
    claimBtn.disabled = false;
    claimBtn.innerHTML = 'Claim Daily Coins';
  }
}

// Server Management Action Controller
let isAutoRedirectingToPackages = false;

function updatePidBadge(status, pid) {
  const pidBadge = document.getElementById('server-pid-badge');
  if (!pidBadge) return;

  if (status === 'running') {
    const displayPid = (pid && pid > 0) ? `PID: ${pid}` : 'PID: Running';
    pidBadge.textContent = displayPid;
    pidBadge.style.background = 'rgba(16, 185, 129, 0.12)';
    pidBadge.style.color = '#059669';
    pidBadge.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    pidBadge.className = 'pid-active';
  } else {
    pidBadge.textContent = 'PID: Offline';
    pidBadge.style.background = '#F1F5F9';
    pidBadge.style.color = '#64748B';
    pidBadge.style.border = '1px solid #E2E8F0';
    pidBadge.className = 'pid-offline';
  }
}

async function executeServerAction(serverId, action) {
  const btnStart = document.getElementById('btn-start-server');
  const btnRestart = document.getElementById('btn-restart-server');
  const btnStop = document.getElementById('btn-stop-server');
  const statusBadge = document.getElementById('server-status-badge');

  if (btnStart) btnStart.disabled = true;
  if (btnRestart) btnRestart.disabled = true;
  if (btnStop) btnStop.disabled = true;

  if (action === 'start') {
    if (btnStart) {
      btnStart.innerHTML = '<span class="spinner-inline"></span> Starting Server...';
    }
    showToast('Checking dependencies & starting Python process...', 'info', 2500);
    // Refresh live logs immediately
    if (typeof window.triggerFetchLogs === 'function') {
      window.triggerFetchLogs();
    }
  } else {
    showToast(`Executing ${action.toUpperCase()}...`, 'info', 2000);
  }

  try {
    const res = await fetch(`/api/servers/${serverId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action })
    });
    const data = await res.json();

    if (data.no_entry_file) {
      showToast(data.message || 'Please upload your project files and main entry file before starting the server.', 'warning', 4000);
      const modal = document.getElementById('no-entry-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
      if (btnStart) {
        btnStart.className = 'btn-success';
        btnStart.innerHTML = '🟢 START';
        btnStart.disabled = false;
      }
      updatePidBadge('stopped', 0);
      return;
    }

    if (data.package_required) {
      // Missing package detected
      showToast('Missing module error! Check Live Logs for details.', 'warning', 4000);
      if (statusBadge) {
        statusBadge.className = 'status-badge status-package_required';
        statusBadge.innerHTML = '<span class="dot"></span> PACKAGE REQUIRED';
      }
      if (btnStart) {
        btnStart.className = 'btn-success';
        btnStart.innerHTML = '🟢 START';
        btnStart.disabled = false;
      }
      updatePidBadge('package_required', 0);
      // Immediately fetch logs to display the red error line live in the terminal
      if (typeof window.triggerFetchLogs === 'function') {
        window.triggerFetchLogs();
      }
      return;
    }

    if (data.success) {
      showToast(data.message, 'success');
      if (statusBadge) {
        if (data.status === 'running') {
          statusBadge.className = 'status-badge status-running';
          statusBadge.innerHTML = '<span class="dot"></span> RUNNING';
        } else if (data.status === 'stopped') {
          statusBadge.className = 'status-badge status-stopped';
          statusBadge.innerHTML = '<span class="dot"></span> STOPPED';
        }
      }
      updatePidBadge(data.status, data.pid);
      if (data.status) {
        updateStatusAndUptimeCard(data.status, data.start_time);
      }
      if (btnStart) {
        btnStart.className = 'btn-success';
        btnStart.innerHTML = '🟢 START';
        btnStart.disabled = (data.status === 'running');
      }
      if (btnStop) {
        btnStop.disabled = (data.status === 'stopped');
      }
      // Trigger log refresh
      if (typeof window.triggerFetchLogs === 'function') {
        setTimeout(window.triggerFetchLogs, 300);
      }
    } else {
      showToast(data.message || 'Action failed.', 'danger');
      if (btnStart) {
        btnStart.className = 'btn-success';
        btnStart.innerHTML = '🟢 START';
      }
      updatePidBadge(data.status || 'stopped', data.pid || 0);
    }
  } catch (err) {
    showToast('Server communication error.', 'danger');
    if (btnStart) {
      btnStart.className = 'btn-success';
      btnStart.innerHTML = '🟢 START';
    }
    updatePidBadge('stopped', 0);
  } finally {
    if (btnStart && action !== 'start') btnStart.disabled = false;
    if (btnRestart) btnRestart.disabled = false;
    if (btnStop) btnStop.disabled = false;
  }
}

// Live Terminal Log Polling
let logPollInterval = null;
let lastLogText = '';
let serverStartTime = 0;
let uptimeInterval = null;

function formatUptime(totalSecs) {
  if (!totalSecs || totalSecs <= 0) return '00:00:00';
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function updateStatusAndUptimeCard(status, startTime) {
  const dot = document.getElementById('card-status-dot');
  const text = document.getElementById('card-status-text');
  const counter = document.getElementById('card-uptime-counter');

  const isRunning = (status === 'running');

  if (dot) {
    dot.style.background = isRunning ? '#10B981' : '#EF4444';
  }

  if (text) {
    text.textContent = isRunning ? 'Running' : 'Offline';
    text.style.color = isRunning ? '#10B981' : '#EF4444';
  }

  if (isRunning && startTime && startTime > 0) {
    if (serverStartTime !== startTime || !uptimeInterval) {
      serverStartTime = startTime;
      if (uptimeInterval) clearInterval(uptimeInterval);
      
      const updateTick = () => {
        const cnt = document.getElementById('card-uptime-counter');
        if (!cnt) return;
        const nowSecs = Date.now() / 1000;
        const elapsed = Math.max(0, Math.floor(nowSecs - serverStartTime));
        cnt.textContent = formatUptime(elapsed);
      };

      updateTick();
      uptimeInterval = setInterval(updateTick, 1000);
    }
  } else {
    serverStartTime = 0;
    if (uptimeInterval) {
      clearInterval(uptimeInterval);
      uptimeInterval = null;
    }
    if (counter) {
      counter.textContent = '00:00:00';
    }
  }
}

function convertLogTimestampsToLocal(logText) {
  if (!logText) return '';
  return logText.replace(/(\[?)\b(\d{4}-\d{2}-\d{2})[\sT](\d{2}:\d{2}:\d{2})(?:\.\d+)?Z?(\]?)/g, (match, p1, dateStr, timeStr, p2) => {
    try {
      const utcIso = `${dateStr}T${timeStr}Z`;
      const dateObj = new Date(utcIso);
      if (!isNaN(dateObj.getTime())) {
        const localTimeString = dateObj.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const formatted = `${yyyy}-${mm}-${dd} ${localTimeString}`;
        return (p1 && p2) ? `[${formatted}]` : formatted;
      }
    } catch (e) {
      console.warn('Error converting log timestamp', e);
    }
    return match;
  });
}

function startLiveLogs(serverId, initialStatus, initialStartTime) {
  const terminal = document.getElementById('live-terminal');
  if (!terminal) return;

  if (initialStatus) {
    updateStatusAndUptimeCard(initialStatus, initialStartTime);
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`/api/servers/${serverId}/logs`);
      const data = await res.json();

      if (data.raw_logs !== lastLogText) {
        lastLogText = data.raw_logs;
        renderTerminalLogs(data.raw_logs, data.db_logs);
      }

      // Auto update status badge, PID badge, & Status/Uptime card
      const badge = document.getElementById('server-status-badge');
      const btnStart = document.getElementById('btn-start-server');
      const btnStop = document.getElementById('btn-stop-server');
      
      updatePidBadge(data.status, data.pid);
      updateStatusAndUptimeCard(data.status, data.start_time);

      if (badge && data.status) {
        if (data.status === 'running') {
          badge.className = 'status-badge status-running';
          badge.innerHTML = '<span class="dot"></span> RUNNING';
          if (btnStart) {
            btnStart.disabled = true;
            btnStart.className = 'btn-success';
            btnStart.innerHTML = '🟢 START';
          }
          if (btnStop) btnStop.disabled = false;
        } else if (data.status === 'package_required') {
          badge.className = 'status-badge status-package_required';
          badge.innerHTML = '<span class="dot"></span> PACKAGE REQUIRED';
          if (btnStart) {
            btnStart.disabled = false;
            btnStart.className = 'btn-success';
            btnStart.innerHTML = '🟢 START';
          }
          if (btnStop) btnStop.disabled = true;
        } else if (data.status === 'stopped') {
          badge.className = 'status-badge status-stopped';
          badge.innerHTML = '<span class="dot"></span> STOPPED';
          if (btnStart) {
            btnStart.disabled = false;
            btnStart.className = 'btn-success';
            btnStart.innerHTML = '🟢 START';
          }
          if (btnStop) btnStop.disabled = true;
        }
      }
    } catch (err) {
      console.warn('Log polling error', err);
    }
  }

  window.triggerFetchLogs = fetchLogs;
  fetchLogs();
  logPollInterval = setInterval(fetchLogs, 1200);
}

function renderTerminalLogs(rawText, dbLogs) {
  const terminal = document.getElementById('live-terminal');
  if (!terminal) return;

  if (!rawText && (!dbLogs || dbLogs.length === 0)) {
    terminal.innerHTML = '<div class="log-line log-info">[INFO] Server log terminal ready. Press 🟢 START to run your Python project.</div>';
    return;
  }

  let html = '';
  const convertedText = convertLogTimestampsToLocal(rawText || '');
  const lines = convertedText.split('\n');

  lines.forEach(line => {
    if (!line.trim()) return;
    let cls = 'log-line';
    if (line.includes('[INFO]')) cls += ' log-info';
    else if (line.includes('[WARNING]') || line.includes('[WARN]')) cls += ' log-warn';
    else if (line.includes('[ERROR]') || line.includes('Traceback') || line.includes('ModuleNotFoundError') || line.includes('ImportError') || line.includes('Error') || line.includes('Exception')) cls += ' log-error';
    else if (line.includes('[STARTING]')) cls += ' log-start';
    else if (line.includes('[STOPPING]')) cls += ' log-stop';
    else if (line.includes('[pip]')) cls += ' log-pip';

    // Safe escaping
    const safeLine = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += `<div class="${cls}">${safeLine}</div>`;
  });

  terminal.innerHTML = html;
  terminal.scrollTop = terminal.scrollHeight;
}

async function clearLogs(serverId) {
  try {
    const res = await fetch(`/api/servers/${serverId}/logs/clear`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Logs cleared.', 'info');
      const terminal = document.getElementById('live-terminal');
      if (terminal) terminal.innerHTML = '<div class="log-line log-info">[INFO] Logs cleared.</div>';
    }
  } catch (err) {
    showToast('Failed to clear logs.', 'danger');
  }
}

// Safe Zip Extraction
async function triggerUnzip(serverId, filePath) {
  if (!confirm(`Extract archive: ${filePath}?`)) return;
  showToast('Extracting ZIP archive...', 'info');

  try {
    const res = await fetch(`/api/servers/${serverId}/files/unzip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast(data.message || 'Extraction failed.', 'danger');
    }
  } catch (err) {
    showToast('Server error during extraction.', 'danger');
  }
}

// Delete file/folder
async function deleteServerItem(serverId, itemPath) {
  if (!confirm(`Are you sure you want to delete "${itemPath}"?`)) return;

  try {
    const res = await fetch(`/api/servers/${serverId}/files/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: itemPath })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Deleted successfully.', 'success');
      setTimeout(() => location.reload(), 600);
    } else {
      showToast(data.message || 'Delete failed.', 'danger');
    }
  } catch (err) {
    showToast('Error deleting item.', 'danger');
  }
}

// Rename file/folder
async function renameServerItem(serverId, oldPath) {
  const baseName = oldPath.split('/').pop();
  const newName = prompt('Enter new name:', baseName);
  if (!newName || newName === baseName) return;

  try {
    const res = await fetch(`/api/servers/${serverId}/files/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_path: oldPath, new_name: newName })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => location.reload(), 600);
    } else {
      showToast(data.message || 'Rename failed.', 'danger');
    }
  } catch (err) {
    showToast('Error renaming item.', 'danger');
  }
}

// Open / Edit text file modal
async function openFileEditor(serverId, filePath) {
  try {
    const res = await fetch(`/api/servers/${serverId}/files/read?path=${encodeURIComponent(filePath)}`);
    const data = await res.json();
    if (data.success) {
      const modal = document.getElementById('file-editor-modal');
      const filenameEl = document.getElementById('editor-filename');
      const textarea = document.getElementById('editor-content');
      const pathHidden = document.getElementById('editor-path');

      if (modal && textarea) {
        filenameEl.textContent = data.filename;
        textarea.value = data.content;
        pathHidden.value = filePath;
        modal.style.display = 'flex';
      }
    } else {
      showToast('Could not open file: ' + data.message, 'danger');
    }
  } catch (err) {
    showToast('Failed to load file content.', 'danger');
  }
}

async function saveFileEditor(serverId) {
  const modal = document.getElementById('file-editor-modal');
  const pathHidden = document.getElementById('editor-path');
  const textarea = document.getElementById('editor-content');
  const saveBtn = document.getElementById('editor-save-btn');

  if (!pathHidden || !textarea) return;

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const res = await fetch(`/api/servers/${serverId}/files/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathHidden.value, content: textarea.value })
    });
    const data = await res.json();
    if (data.success) {
      showToast('File saved successfully ✓', 'success');
      if (modal) modal.style.display = 'none';
    } else {
      showToast('Save failed: ' + data.message, 'danger');
    }
  } catch (err) {
    showToast('Error saving file.', 'danger');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  }
}

// Package Installer
async function installPackageDirect(serverId, packageName, version = '', isReqs = false) {
  const progressBox = document.getElementById('pkg-progress-container');
  const progressFill = document.getElementById('pkg-progress-fill');
  const progressText = document.getElementById('pkg-progress-text');
  const pkgOutput = document.getElementById('pkg-install-output');

  if (progressBox) progressBox.style.display = 'block';
  if (progressFill) {
    progressFill.style.width = '35%';
    progressFill.style.background = 'var(--primary-grad)';
  }
  const displayTitle = isReqs ? 'requirements.txt' : (version && version !== 'latest' ? `${packageName}==${version}` : packageName);
  if (progressText) progressText.textContent = `Installing ${displayTitle}...`;
  if (pkgOutput) pkgOutput.textContent = `[INFO] Launching pip installer subprocess for ${displayTitle}...\n[INFO] Sandbox target: ./packages/\n`;

  showToast(`Installing ${displayTitle}...`, 'info');

  try {
    const res = await fetch(`/api/servers/${serverId}/packages/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_name: packageName, version: version, is_requirements: isReqs })
    });
    const data = await res.json();

    if (data.success) {
      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent = 'Installation Complete ✓ Ready to Run';
      if (pkgOutput) pkgOutput.textContent += (data.output || '') + `\n[SUCCESS] ${displayTitle} installation finished. Server dependencies satisfied!`;
      showToast(`✓ ${displayTitle} installed successfully!`, 'success');
      setTimeout(() => location.reload(), 1600);
    } else {
      if (progressFill) {
        progressFill.style.width = '100%';
        progressFill.style.background = 'var(--color-danger)';
      }
      if (progressText) progressText.textContent = 'Installation Failed ✕';
      if (pkgOutput) pkgOutput.textContent += (data.output || '') + `\n[ERROR] ${data.message}`;
      showToast(data.message || 'Installation failed.', 'danger');
    }
  } catch (err) {
    showToast('Installation request failed.', 'danger');
    if (pkgOutput) pkgOutput.textContent += '\n[FATAL] Network error communicating with host.';
  }
}

async function installAllMissingPackages(serverId) {
  const progressBox = document.getElementById('pkg-progress-container');
  const progressFill = document.getElementById('pkg-progress-fill');
  const progressText = document.getElementById('pkg-progress-text');
  const pkgOutput = document.getElementById('pkg-install-output');

  if (progressBox) progressBox.style.display = 'block';
  if (progressFill) {
    progressFill.style.width = '30%';
    progressFill.style.background = 'var(--primary-grad)';
  }
  if (progressText) progressText.textContent = 'Batch Installing All Dependencies...';
  if (pkgOutput) pkgOutput.textContent = '[INFO] Starting sequential batch installation of all missing dependencies...\n';

  showToast('Installing all packages...', 'info');

  try {
    const res = await fetch(`/api/servers/${serverId}/packages/install-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.success) {
      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent = 'All Packages Installed Successfully ✓';
      if (pkgOutput) pkgOutput.textContent += (data.logs || '') + '\n[SUCCESS] All dependencies satisfied. Ready to start server!';
      showToast('✓ All dependencies installed successfully!', 'success');
      setTimeout(() => location.reload(), 1800);
    } else {
      if (progressFill) {
        progressFill.style.width = '100%';
        progressFill.style.background = 'var(--color-danger)';
      }
      if (progressText) progressText.textContent = 'Some Packages Failed ✕';
      if (pkgOutput) pkgOutput.textContent += (data.logs || '') + `\n[ERROR] ${data.message}`;
      showToast(data.message || 'Batch installation encountered errors.', 'danger');
    }
  } catch (err) {
    showToast('Error during batch package installation.', 'danger');
  }
}

async function deletePackageDirect(serverId, packageName) {
  if (!confirm(`Uninstall package "${packageName}" from server?`)) return;
  showToast(`Removing ${packageName}...`, 'info');

  try {
    const res = await fetch(`/api/servers/${serverId}/packages/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_name: packageName })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => location.reload(), 800);
    } else {
      showToast(data.message || 'Failed to remove package.', 'danger');
    }
  } catch (err) {
    showToast('Error removing package.', 'danger');
  }
}

/* ==========================================================================
   NOTIFICATION BELL SYSTEM HANDLERS
   ========================================================================== */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNotificationTime(rawTimeStr) {
  if (!rawTimeStr) return '';
  try {
    const normalized = rawTimeStr.replace(' ', 'T');
    const dt = new Date(normalized.endsWith('Z') ? normalized : normalized + 'Z');
    if (isNaN(dt.getTime())) {
      const altDt = new Date(rawTimeStr);
      if (!isNaN(altDt.getTime())) {
        return altDt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return rawTimeStr;
    }
    return dt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return rawTimeStr;
  }
}

async function fetchNotifications() {
  const bellBtn = document.getElementById('notif-bell-btn');
  if (!bellBtn) return;

  const badge = document.getElementById('notif-badge');
  const container = document.getElementById('notif-list-container');

  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const data = await res.json();

    if (data.success) {
      if (badge) {
        if (data.unread_count > 0) {
          badge.textContent = '';
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }

      if (container) {
        if (!data.notifications || data.notifications.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; color: #94A3B8; font-size: 0.85rem; padding: 32px 16px;">
              <div style="font-size: 1.8rem; margin-bottom: 6px;">🔕</div>
              <div>No notifications yet</div>
            </div>
          `;
        } else {
          container.innerHTML = data.notifications.map(n => `
            <div class="notif-item" id="notif-item-${n.id}">
              <div style="flex: 1; min-width: 0;">
                <div class="notif-item-title">${escapeHtml(n.title)}</div>
                <div class="notif-item-msg">${escapeHtml(n.message)}</div>
                <div class="notif-item-time">${formatNotificationTime(n.created_at)}</div>
              </div>
              <button type="button" class="notif-delete-btn" onclick="deleteNotification(event, ${n.id})" title="Delete Notification">
                🗑️
              </button>
            </div>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  }
}

async function onNotificationBellClick(e) {
  const badge = document.getElementById('notif-badge');
  if (badge && badge.style.display !== 'none') {
    badge.style.display = 'none';
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  }
}

async function deleteNotification(e, notifId) {
  if (e) e.stopPropagation();

  const itemEl = document.getElementById(`notif-item-${notifId}`);
  if (itemEl) {
    itemEl.style.opacity = '0.4';
    itemEl.style.pointerEvents = 'none';
  }

  try {
    const res = await fetch(`/api/notifications/${notifId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.success) {
      if (itemEl) itemEl.remove();

      const container = document.getElementById('notif-list-container');
      if (container && container.querySelectorAll('.notif-item').length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: #94A3B8; font-size: 0.85rem; padding: 32px 16px;">
            <div style="font-size: 1.8rem; margin-bottom: 6px;">🔕</div>
            <div>No notifications remaining</div>
          </div>
        `;
      }

      const badge = document.getElementById('notif-badge');
      if (badge) {
        if (data.unread_count > 0) {
          badge.textContent = '';
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
      showToast('Notification deleted', 'info');
    }
  } catch (err) {
    if (itemEl) {
      itemEl.style.opacity = '1';
      itemEl.style.pointerEvents = 'auto';
    }
    showToast('Failed to delete notification', 'danger');
  }
}

async function clearAllNotifications(e) {
  if (e) e.stopPropagation();

  const container = document.getElementById('notif-list-container');
  if (!container || container.querySelectorAll('.notif-item').length === 0) return;

  if (!confirm('Are you sure you want to clear all notifications?')) return;

  try {
    const res = await fetch('/api/notifications/clear-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.success) {
      container.innerHTML = `
        <div style="text-align: center; color: #94A3B8; font-size: 0.85rem; padding: 32px 16px;">
          <div style="font-size: 1.8rem; margin-bottom: 6px;">🔕</div>
          <div>All notifications cleared</div>
        </div>
      `;

      const badge = document.getElementById('notif-badge');
      if (badge) badge.style.display = 'none';

      showToast('All notifications cleared', 'success');
    }
  } catch (err) {
    showToast('Failed to clear notifications', 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchNotifications();
});
