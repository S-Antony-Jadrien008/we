/**
 * EduVerse — Main Dashboard & SPA Router Controller (script.js)
 * Manages view routing across all 7 integrated modules,
 * progress synchronization, recommendations, service workers, and accessibility.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- 1. Service Worker Registration ---
  if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[EduVerse] Service Worker active, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[EduVerse] Service Worker registration failed:', err);
      });
  }

  // --- 2. Live Connectivity Status Indicator ---
  const connIndicator = document.getElementById('connectivity-indicator');
  const connText = document.getElementById('connectivity-text');

  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    if (isOnline) {
      if (connIndicator) connIndicator.classList.remove('offline-active');
      if (connText) connText.textContent = 'Online';
    } else {
      if (connIndicator) connIndicator.classList.add('offline-active');
      if (connText) connText.textContent = 'Offline (Cache)';
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // --- 3. Accessibility Controls (Font Size & Contrast) ---
  document.querySelectorAll('[data-font-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.getAttribute('data-font-size');
      if (window.EduVerseProgress) window.EduVerseProgress.setPreference('fontSize', size);
    });
  });

  const contrastBtn = document.querySelector('[data-toggle-contrast]');
  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      if (window.EduVerseProgress) {
        const current = window.EduVerseProgress.getState();
        window.EduVerseProgress.setPreference('highContrast', !current.preferences.highContrast);
      }
    });
  }

  // --- 4. Single Page Application (SPA) View Routing ---
  const views = {
    'dashboard': document.getElementById('view-dashboard'),
    'mindshift': document.getElementById('view-mindshift'),
    'whatif': document.getElementById('view-whatif'),
    'errordna': document.getElementById('view-errordna'),
    'boardbridge': document.getElementById('view-boardbridge'),
    'silentsignal': document.getElementById('view-silentsignal'),
    'zeronet': document.getElementById('view-zeronet'),
    'escape': document.getElementById('view-escape')
  };

  function switchView(targetViewId, param = null) {
    const cleanId = (targetViewId || 'dashboard').toLowerCase().trim();
    const activeView = views[cleanId] || views['dashboard'];

    // Hide all views, activate selected view
    for (const key in views) {
      if (views[key]) {
        views[key].classList.toggle('active', views[key] === activeView);
      }
    }

    // Update Nav Pills
    document.querySelectorAll('.nav-pill-btn').forEach((btn) => {
      const btnTarget = btn.getAttribute('data-nav-target');
      btn.classList.toggle('active', btnTarget === cleanId);
    });

    // Update URL Hash without jump
    if (window.location.hash.replace('#', '') !== cleanId) {
      history.pushState(null, null, `#${cleanId}${param ? `?topic=${param}` : ''}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // When switching to dashboard, update stats immediately
    if (cleanId === 'dashboard') {
      renderDashboard();
    }

    // If deep-linking to boardbridge with parameter
    if (cleanId === 'boardbridge' && param && typeof window.selectBoardBridgeTopicByParam === 'function') {
      window.selectBoardBridgeTopicByParam(param);
    }
  }

  // Attach click listener to any element with data-nav-target
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav-target]');
    if (navBtn) {
      e.preventDefault();
      const target = navBtn.getAttribute('data-nav-target');
      const param = navBtn.getAttribute('data-topic-param');
      switchView(target, param);
    }
  });

  // Jump to modules section on dashboard
  const jumpModulesBtn = document.getElementById('btn-jump-modules');
  if (jumpModulesBtn) {
    jumpModulesBtn.addEventListener('click', () => {
      const el = document.getElementById('ecosystem-modules');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Handle URL Hash on load & back/forward navigation
  function handleUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      switchView('dashboard');
      return;
    }
    const [viewName, queryStr] = hash.split('?');
    let topicParam = null;
    if (queryStr) {
      const p = new URLSearchParams(queryStr);
      topicParam = p.get('topic');
    }
    switchView(viewName, topicParam);
  }

  window.addEventListener('hashchange', handleUrlHash);

  // --- 5. Presentation Sequence Walkthrough Toggle ---
  const tourToggleBtn = document.getElementById('btn-toggle-judge-tour');
  const tourCard = document.getElementById('judge-tour-card');
  const tourCloseBtn = document.getElementById('btn-close-judge-tour');

  if (tourToggleBtn && tourCard) {
    tourToggleBtn.addEventListener('click', () => {
      const isVisible = tourCard.style.display !== 'none';
      tourCard.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) tourCard.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (tourCloseBtn && tourCard) {
    tourCloseBtn.addEventListener('click', () => {
      tourCard.style.display = 'none';
    });
  }

  // --- 6. Reset Progress Modal Dialog ---
  const openResetBtn = document.getElementById('btn-open-reset');
  const resetModal = document.getElementById('reset-modal');
  const closeResetBtn = document.getElementById('btn-close-modal');
  const cancelResetBtn = document.getElementById('btn-cancel-reset');
  const confirmResetBtn = document.getElementById('btn-confirm-reset');
  const toastEl = document.getElementById('toast-element');
  const toastMsg = document.getElementById('toast-message');

  function showToast(message) {
    if (!toastEl) return;
    if (toastMsg) toastMsg.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  }

  function openResetDialog() {
    if (resetModal) {
      resetModal.classList.add('open');
      if (cancelResetBtn) cancelResetBtn.focus();
    }
  }

  function closeResetDialog() {
    if (resetModal) {
      resetModal.classList.remove('open');
      if (openResetBtn) openResetBtn.focus();
    }
  }

  if (openResetBtn) openResetBtn.addEventListener('click', openResetDialog);
  if (closeResetBtn) closeResetBtn.addEventListener('click', closeResetDialog);
  if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeResetDialog);

  if (resetModal) {
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) closeResetDialog();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && resetModal.classList.contains('open')) closeResetDialog();
    });
  }

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', () => {
      if (window.EduVerseProgress) {
        window.EduVerseProgress.resetProgress();
        showToast('All learning progress and demo scores have been reset.');
        closeResetDialog();
        renderDashboard();
      }
    });
  }

  // --- 7. Render Dashboard Progress & Module Status ---
  function renderDashboard() {
    if (!window.EduVerseProgress) return;
    const state = window.EduVerseProgress.getState();
    const stats = window.EduVerseProgress.getOverallStats();

    // Stats counts
    const statModulesCount = document.getElementById('stat-modules-count');
    const statModulesPct = document.getElementById('stat-modules-pct');
    const progressBarElement = document.getElementById('progress-bar-element');
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressPercentLabel = document.getElementById('progress-percent-label');

    if (statModulesCount) statModulesCount.textContent = `${stats.completedModules} / ${stats.totalModules}`;
    if (statModulesPct) statModulesPct.textContent = `${stats.overallPercentage}% Complete`;
    if (progressBarElement) progressBarElement.style.width = `${stats.overallPercentage}%`;
    if (progressBarContainer) progressBarContainer.setAttribute('aria-valuenow', stats.overallPercentage);
    if (progressPercentLabel) progressPercentLabel.textContent = `${stats.overallPercentage}%`;

    // WhatIf Lab Stats
    const statWhatIfScore = document.getElementById('stat-whatif-score');
    const statWhatIfMeta = document.getElementById('stat-whatif-meta');
    if (statWhatIfScore) statWhatIfScore.textContent = `${state.whatif.score} / ${state.whatif.totalScenarios}`;
    if (statWhatIfMeta) {
      statWhatIfMeta.textContent = state.whatif.completed ? 'All 3 completed' : `${Object.keys(state.whatif.answers || {}).length} answered`;
    }

    // ErrorDNA Stats
    const statErrorDnaScore = document.getElementById('stat-errordna-score');
    const statErrorDnaMeta = document.getElementById('stat-errordna-meta');
    if (statErrorDnaScore) {
      statErrorDnaScore.textContent = state.errordna.completed ? `${state.errordna.overallScore} / ${state.errordna.totalQuestions}` : 'Not Taken';
    }
    if (statErrorDnaMeta) {
      if (state.errordna.completed) {
        const weakCount = (state.errordna.weakTopics || []).length;
        statErrorDnaMeta.textContent = weakCount > 0 ? `${weakCount} weak topic(s) flagged` : 'Strong grasp across all topics!';
      } else {
        statErrorDnaMeta.textContent = 'Take 9-Q diagnostic';
      }
    }

    // Escape2Learn Stats
    const statEscapeLevel = document.getElementById('stat-escape-level');
    const statEscapeMeta = document.getElementById('stat-escape-meta');
    if (statEscapeLevel) {
      const maxLevel = Math.max(...(state.escape2learn.unlockedLevels || [1]));
      statEscapeLevel.textContent = state.escape2learn.completed ? 'Escaped! ★' : `Level ${maxLevel}`;
    }
    if (statEscapeMeta) {
      if (state.escape2learn.completed) {
        statEscapeMeta.textContent = 'All 3 rooms mastered';
      } else {
        const completedCount = (state.escape2learn.completedLevels || []).length;
        statEscapeMeta.textContent = `${completedCount} of 3 rooms solved`;
      }
    }

    // Journey Steps Badges
    updateJourneyBadge('j-badge-mindshift', state.mindshift.completed, 'Completed', 'Start');
    updateJourneyBadge('j-badge-whatif', state.whatif.completed, `${state.whatif.score}/3 Passed`, 'Pending');
    updateJourneyBadge('j-badge-errordna', state.errordna.completed, `${state.errordna.overallScore}/9 Evaluated`, 'Pending');
    updateJourneyBadge('j-badge-boardbridge', state.boardbridge.completed || (state.boardbridge.viewedTopics && state.boardbridge.viewedTopics.length > 0), 'Visited', 'Pending');
    updateJourneyBadge('j-badge-escape2learn', state.escape2learn.completed, 'Mastered', `Level ${Math.max(...(state.escape2learn.unlockedLevels || [1]))}`);

    // Module Card Badges
    updateModuleCardBadge('badge-mod-mindshift', state.mindshift.completed ? 'badge-completed' : 'badge-not-started', state.mindshift.completed ? 'Completed' : 'Not Started');
    updateModuleCardBadge('badge-mod-whatif', state.whatif.completed ? 'badge-completed' : (Object.keys(state.whatif.answers || {}).length > 0 ? 'badge-in-progress' : 'badge-not-started'), state.whatif.completed ? `Score: ${state.whatif.score}/3` : (Object.keys(state.whatif.answers || {}).length > 0 ? 'In Progress' : 'Not Started'));
    updateModuleCardBadge('badge-mod-errordna', state.errordna.completed ? 'badge-completed' : 'badge-not-started', state.errordna.completed ? `Accuracy: ${Math.round((state.errordna.overallScore / state.errordna.totalQuestions) * 100)}%` : 'Not Started');
    updateModuleCardBadge('badge-mod-boardbridge', (state.boardbridge.viewedTopics && state.boardbridge.viewedTopics.length > 0) ? 'badge-completed' : 'badge-not-started', (state.boardbridge.viewedTopics && state.boardbridge.viewedTopics.length > 0) ? `${state.boardbridge.viewedTopics.length} Topics Read` : 'Not Started');
    updateModuleCardBadge('badge-mod-silentsignal', state.silentsignal.feedbackCount > 0 ? 'badge-teal' : 'badge-not-started', `${state.silentsignal.feedbackCount} Doubts Logged`);
    updateModuleCardBadge('badge-mod-zeronet', (state.zeronet.cachedLessons && state.zeronet.cachedLessons.length > 0) ? 'badge-completed' : 'badge-not-started', `${(state.zeronet.cachedLessons || []).length} Saved Offline`);
    updateModuleCardBadge('badge-mod-escape', state.escape2learn.completed ? 'badge-completed' : 'badge-teal', state.escape2learn.completed ? 'Trophy Unlocked' : `Level ${Math.max(...(state.escape2learn.unlockedLevels || [1]))} Ready`);

    // Dynamic Recommendations Banner
    const recBox = document.getElementById('dynamic-recommendation-box');
    const recTitle = document.getElementById('rec-title');
    const recDesc = document.getElementById('rec-desc');
    const recActions = document.getElementById('rec-actions');

    if (recBox && recTitle && recDesc && recActions) {
      if (state.errordna.completed) {
        recBox.style.display = 'flex';
        const weak = state.errordna.weakTopics || [];
        if (weak.length > 0) {
          recBox.classList.remove('all-good');
          const topicNames = weak.map(w => w.toUpperCase()).join(', ');
          recTitle.textContent = `Targeted Revision Recommended for: ${topicNames}`;
          recDesc.textContent = `Your ErrorDNA diagnostic highlighted gaps (<60% accuracy). Reinforce concepts in BoardBridge or test in Escape2Learn.`;
          
          const primaryWeak = weak[0];
          recActions.innerHTML = `
            <button type="button" class="btn btn-primary btn-sm" data-nav-target="boardbridge" data-topic-param="${primaryWeak}">
              Review ${primaryWeak.toUpperCase()} Notes →
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-nav-target="escape" style="margin-left: 0.5rem;">
              Practice in Escape2Learn
            </button>
          `;
        } else {
          recBox.classList.add('all-good');
          recTitle.textContent = `All Subjects Strong (≥ 60% Accuracy)!`;
          recDesc.textContent = `You've demonstrated solid understanding across DBMS, Java, and Networking. Take on Level 3 in Escape2Learn!`;
          recActions.innerHTML = `
            <button type="button" class="btn btn-primary btn-sm" data-nav-target="escape">
              Launch Escape2Learn Core →
            </button>
          `;
        }
      } else if (state.whatif.completed && !state.errordna.completed) {
        recBox.style.display = 'flex';
        recBox.classList.remove('all-good');
        recTitle.textContent = `Next Recommended Step: ErrorDNA Diagnostic`;
        recDesc.textContent = `You resolved the WhatIf Lab scenarios! Now pinpoint your specific subject strengths and weaknesses across 9 questions.`;
        recActions.innerHTML = `
          <button type="button" class="btn btn-primary btn-sm" data-nav-target="errordna">
            Start ErrorDNA Diagnostic →
          </button>
        `;
      } else {
        recBox.style.display = 'none';
      }
    }
  }

  function updateJourneyBadge(elementId, isComplete, completeText, pendingText) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = isComplete ? 'badge badge-completed' : 'badge badge-not-started';
    el.textContent = isComplete ? completeText : pendingText;
  }

  function updateModuleCardBadge(elementId, badgeClass, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `badge ${badgeClass}`;
    el.textContent = text;
  }

  // Initial routing and render
  handleUrlHash();
  renderDashboard();

  window.addEventListener('eduverse:statechange', renderDashboard);
  window.addEventListener('eduverse:progressreset', renderDashboard);
  window.addEventListener('storage', renderDashboard);
});
