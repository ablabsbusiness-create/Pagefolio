/* =========================================
   PAGEFOLIO - Main JavaScript
   ========================================= */

const PF_HOST = window.location.hostname || '127.0.0.1';
const PF_PROTOCOL = window.location.protocol.startsWith('http') ? window.location.protocol : 'http:';
const PF_CONFIG = window.__PF_CONFIG__ || {};

function resolveApiBase() {
  const metaApiBase = document.querySelector('meta[name="pf-api-base"]')?.content?.trim();
  const configuredApiBase =
    metaApiBase ||
    String(PF_CONFIG.apiBase || '').trim() ||
    String(localStorage.getItem('pf-api-base') || '').trim();

  if (configuredApiBase) {
    return configuredApiBase.replace(/\/+$/, '');
  }

  const isLocalHost =
    PF_HOST === 'localhost' ||
    PF_HOST === '127.0.0.1' ||
    PF_HOST === '::1';

  if (isLocalHost) {
    return `${PF_PROTOCOL}//${PF_HOST}:5000/api`;
  }

  return '/api';
}

const PF_API_BASE = resolveApiBase();
const PF_PUBLIC_BASE = String(PF_CONFIG.publicBase || 'https://ablabsbusiness-create.github.io/Pagefolio').replace(/\/+$/, '');
const PF_TOKEN_KEY = 'pf-auth-token';
const PF_USER_KEY = 'pf-auth-user';
const PF_PRODUCT_KEY = 'pf-product-choice';
const PF_LINK_KEY = 'pf-preferred-link';
const PF_CATEGORY_KEY = 'pf-category';
const PF_POST_PUBLISH_KEY = 'pf-post-publish';
const PF_ADMIN_EMAIL = 'aadityab660@gmail.com';

// Theme System
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('pf-theme', theme);
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function initTheme() {
  const saved = localStorage.getItem('pf-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

initTheme();

// Nav Scroll Behavior
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Mobile Nav
const hamburger = document.getElementById('navHamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const isOpen = mobileNav.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mobileNav.classList.remove('open'));
  });

  document.addEventListener('click', (event) => {
    if (!hamburger.contains(event.target) && !mobileNav.contains(event.target)) {
      mobileNav.classList.remove('open');
    }
  });
}

// Scroll Reveal
function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, entry.target.dataset.delay || 0);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((element, index) => {
    element.dataset.delay = (index % 4) * 80;
    observer.observe(element);
  });
}

document.addEventListener('DOMContentLoaded', initReveal);

// Toast Notification
function showToast(message, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Copy to Clipboard
function copyToClipboard(text, successMessage = 'Copied!') {
  navigator.clipboard.writeText(text)
    .then(() => showToast(successMessage))
    .catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(successMessage);
    });
}

// Smooth Scroll for anchor links
Array.from(document.querySelectorAll('a[href^="#"]')).forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Number Counter Animation
function animateCounter(element, target, duration = 2000) {
  const increment = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    element.textContent = Math.floor(current).toLocaleString() + (element.dataset.suffix || '');
  }, 16);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target, parseInt(entry.target.dataset.counter, 10), 2000);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((element) => observer.observe(element));
}

document.addEventListener('DOMContentLoaded', initCounters);

// FAQ Accordion
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach((entry) => entry.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', initFAQ);

// Filter Tabs
function initFilters() {
  const filterGroups = document.querySelectorAll('[data-filter-group]');
  filterGroups.forEach((group) => {
    const buttons = group.querySelectorAll('[data-filter]');
    const target = document.querySelector(group.dataset.filterTarget);
    if (!target) return;

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((entry) => entry.classList.remove('active'));
        button.classList.add('active');

        const filter = button.dataset.filter;
        target.querySelectorAll('[data-category]').forEach((item) => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
            item.classList.add('reveal');
            setTimeout(() => item.classList.add('visible'), 10);
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initFilters);

// Explore search
function initExploreSearch() {
  const input = document.getElementById('exploreSearch');
  const grid = document.getElementById('profilesGrid');
  const emptyState = document.getElementById('exploreEmptyState');
  const resultsLabel = document.getElementById('exploreResultsLabel');
  if (!input || !grid) return;

  const cards = Array.from(grid.querySelectorAll('[data-category]'));

  function updateSearch() {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardText = card.textContent.toLowerCase();
      const matches = !query || cardText.includes(query);
      card.classList.toggle('is-hidden-by-search', !matches);
      const visible =
        !card.classList.contains('is-hidden-by-search') &&
        !card.classList.contains('is-hidden-by-product') &&
        card.style.display !== 'none';
      if (visible) visibleCount += 1;
    });

    if (resultsLabel) {
      resultsLabel.textContent = query
        ? `${visibleCount} template${visibleCount === 1 ? '' : 's'} found`
        : 'Showing matching templates';
    }

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  }

  input.addEventListener('input', updateSearch);
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => requestAnimationFrame(updateSearch));
  });
  window.updateExploreSearch = updateSearch;
  updateSearch();
}

document.addEventListener('DOMContentLoaded', initExploreSearch);

function initExploreTemplates() {
  const cards = document.querySelectorAll('[data-product]');
  const storedLink = document.getElementById('exploreStoredLink');
  const continueButton = document.getElementById('continueTemplateButton');
  const templateButtons = document.querySelectorAll('[data-template]');
  const previewButtons = document.querySelectorAll('[data-preview-url]');
  const previewModal = document.getElementById('templatePreviewModal');
  const previewFrame = document.getElementById('templatePreviewFrame');
  const previewChooseButton = document.getElementById('templatePreviewChooseButton');
  const previewCloseButtons = document.querySelectorAll('[data-preview-close]');
  if (!templateButtons.length && !continueButton) return;

  let selectedProduct = localStorage.getItem(PF_PRODUCT_KEY) || 'website';
  let selectedTemplate = localStorage.getItem('pf-selected-template') || '';
  const preferredLink = localStorage.getItem(PF_LINK_KEY) || 'yourname';
  let previewTemplate = '';
  let previewCategory = '';
  let isPublishing = false;

  function applyModeVisibility() {
    cards.forEach((card) => {
      card.classList.toggle('is-hidden-by-product', card.dataset.product !== selectedProduct);
    });

    if (typeof window.updateExploreSearch === 'function') {
      window.updateExploreSearch();
    }
  }

  function syncContinueState() {
    if (!continueButton) return;
    continueButton.textContent = selectedTemplate
      ? 'Continue with selected template'
      : 'Choose a template first';
  }

  function closePreviewModal() {
    if (!previewModal) return;
    previewModal.hidden = true;
    document.body.classList.remove('preview-open');
    if (previewFrame) {
      previewFrame.src = '';
    }
    previewTemplate = '';
  }

  function openPreviewModal(url, templateId, category) {
    if (!previewModal || !previewFrame) return;
    previewTemplate = templateId || '';
    previewCategory = category || '';
    previewFrame.src = url;
    previewModal.hidden = false;
    document.body.classList.add('preview-open');
  }

  async function publishAndGo(templateId, category) {
    if (!getAuthToken()) {
      showToast('Please sign in first');
      setTimeout(() => {
        window.location.href = 'auth.html';
      }, 300);
      return;
    }

    if (!preferredLink) {
      showToast('Choose your preferred link first');
      setTimeout(() => {
        window.location.href = 'choose.html';
      }, 300);
      return;
    }

    if (isPublishing) return;
    isPublishing = true;
    templateButtons.forEach((button) => {
      button.disabled = true;
    });
    if (continueButton) {
      continueButton.disabled = true;
    }
    if (previewChooseButton) {
      previewChooseButton.disabled = true;
    }

    try {
      if (category) {
        localStorage.setItem(PF_CATEGORY_KEY, category);
        await updateFirebaseUserDoc({ category });
      }
      const publishResult = await publishTemplateSelection({
        preferredLink,
        templateId,
        websiteType: selectedProduct
      });
      selectedTemplate = templateId;
      localStorage.setItem('pf-selected-template', selectedTemplate);
      syncContinueState();
      showToast('Template uploaded. Preparing your dashboard');
      setTimeout(() => {
        const serverDashboard = publishResult?.data?.dashboardUrl || '';
        const uid = getStoredUser()?.uid || '';
        const dashboardUrl = buildDashboardUrl(preferredLink, uid);
        const finalDashboardUrl = serverDashboard || dashboardUrl || getDashboardPath(selectedProduct);
        setPostPublishState({
          dashboardUrl: finalDashboardUrl,
          websiteUrl: publishResult?.data?.websiteUrl || buildPublicUrl(preferredLink),
          preferredLink,
          templateId,
          category: category || '',
          websiteType: selectedProduct,
          createdAt: Date.now()
        });
        window.location.href = 'pricing.html?setup=publishing';
      }, 350);
    } catch (error) {
      showToast(error.message || 'Could not upload the template');
    } finally {
      isPublishing = false;
      templateButtons.forEach((button) => {
        button.disabled = false;
      });
      if (continueButton) {
        continueButton.disabled = false;
      }
      if (previewChooseButton) {
        previewChooseButton.disabled = false;
      }
    }
  }

  templateButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.closest('.profile-card')?.dataset.category || '';
      publishAndGo(button.dataset.template, category);
    });
  });

  previewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.closest('.profile-card')?.dataset.category || '';
      openPreviewModal(button.dataset.previewUrl, button.dataset.previewTemplate, category);
    });
  });

  previewCloseButtons.forEach((button) => {
    button.addEventListener('click', closePreviewModal);
  });

  if (previewChooseButton) {
    previewChooseButton.addEventListener('click', () => {
      if (!previewTemplate) {
        closePreviewModal();
        return;
      }

      closePreviewModal();
      publishAndGo(previewTemplate, previewCategory);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && previewModal && !previewModal.hidden) {
      closePreviewModal();
    }
  });

    if (continueButton) {
      continueButton.addEventListener('click', () => {
        if (!selectedTemplate) {
          showToast('Choose a template first');
          return;
        }
        const selectedButton = Array.from(templateButtons).find(
          (button) => button.dataset.template === selectedTemplate
        );
        const category = selectedButton?.closest('.profile-card')?.dataset.category || '';
        publishAndGo(selectedTemplate, category);
      });
    }

  if (storedLink) {
    storedLink.textContent = `Preferred link: ${buildPublicUrl(preferredLink)}`;
  }
  applyModeVisibility();
  syncContinueState();
}

document.addEventListener('DOMContentLoaded', initExploreTemplates);

// Tab switcher (Login/Signup)
function initTabs() {
  const tabGroups = document.querySelectorAll('[data-tab-group]');
  tabGroups.forEach((group) => {
    const tabs = group.querySelectorAll('[data-tab]');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        tabs.forEach((entry) => entry.classList.remove('active'));
        tab.classList.add('active');

        group.querySelectorAll('[data-tab-panel]').forEach((panel) => {
          panel.style.display = panel.dataset.tabPanel === targetId ? '' : 'none';
        });
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initTabs);

// API helpers
function saveAuthSession(token, user) {
  localStorage.setItem(PF_TOKEN_KEY, token);
  localStorage.setItem(PF_USER_KEY, JSON.stringify(user));
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(PF_USER_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function getAuthToken() {
  return localStorage.getItem(PF_TOKEN_KEY) || '';
}

function clearAuthSession() {
  localStorage.removeItem(PF_TOKEN_KEY);
  localStorage.removeItem(PF_USER_KEY);
  sessionStorage.removeItem(PF_TOKEN_KEY);
  sessionStorage.removeItem(PF_USER_KEY);
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const headers = {};

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response;
  try {
    response = await fetch(`${PF_API_BASE}${path}`, {
      headers,
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === 'AbortError') {
      throw new Error('Server did not respond. Is backend running?');
    }
    if (error instanceof TypeError) {
      throw new Error('Could not reach the server. Please refresh and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function buildPublicUrl(slug = '') {
  const safeSlug = (slug || '').replace(/^\/+|\/+$/g, '');
  return safeSlug ? `${PF_PUBLIC_BASE}/${safeSlug}` : PF_PUBLIC_BASE;
}

function buildDashboardUrl(username = '', uid = '') {
  const safeUser = (username || '').replace(/^\/+|\/+$/g, '');
  const safeUid = (uid || '').replace(/^\/+|\/+$/g, '');
  if (!safeUser || !safeUid) return '';
  return `${PF_PUBLIC_BASE}/${safeUser}/${safeUid}/index.html`;
}

function getPostPublishState() {
  try {
    return JSON.parse(sessionStorage.getItem(PF_POST_PUBLISH_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function setPostPublishState(state) {
  if (!state) return;
  sessionStorage.setItem(PF_POST_PUBLISH_KEY, JSON.stringify(state));
}

function clearPostPublishState() {
  sessionStorage.removeItem(PF_POST_PUBLISH_KEY);
}

function syncDashboardLinks() {
  const links = document.querySelectorAll('[data-dashboard-link]');
  if (!links.length) return;
  const preferredLink = localStorage.getItem(PF_LINK_KEY) || '';
  const uid = getStoredUser()?.uid || '';
  const dashboardUrl = buildDashboardUrl(preferredLink, uid);

  links.forEach((link) => {
    if (dashboardUrl) {
      link.setAttribute('href', dashboardUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noreferrer');
    } else {
      link.setAttribute('href', 'dashboard.html');
    }
  });
}

function normalizeUsername(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

function updateUsernameAvailability() {
  const usernameInput = document.getElementById('usernameInput');
  const usernameStatus = document.getElementById('usernameStatus');
  if (!usernameInput || !usernameStatus) return true;

  const value = normalizeUsername(usernameInput.value);
  usernameInput.value = value;
  usernameStatus.textContent = '';
  usernameStatus.className = 'username-status';

  if (!value) return false;

  if (value.length < 3) {
    usernameStatus.textContent = 'Username must be at least 3 characters';
    usernameStatus.classList.add('error');
    return false;
  }

  usernameStatus.textContent = `Looks good: @${value}`;
  usernameStatus.classList.add('success');
  return true;
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input || !button) return;

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Hide';
  } else {
    input.type = 'password';
    button.textContent = 'Show';
  }
}

window.togglePassword = togglePassword;

async function handleSignup() {
  showToast('Email signup is disabled. Use Google login.');
}

async function handleLogin() {
  showToast('Email login is disabled. Use Google login.');
}

async function handleGoogleAuth(credential) {
  showToast('Google login should use Firebase. Please refresh and try again.');
}

window.handleSignup = handleSignup;
window.handleLogin = handleLogin;

function getFirebaseConfig() {
  const apiKey = document
    .querySelector('meta[name="firebase-api-key"]')
    ?.content?.trim();
  const authDomain = document
    .querySelector('meta[name="firebase-auth-domain"]')
    ?.content?.trim();
  const projectId = document
    .querySelector('meta[name="firebase-project-id"]')
    ?.content?.trim();
  const appId = document
    .querySelector('meta[name="firebase-app-id"]')
    ?.content?.trim();

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !appId ||
    apiKey === 'YOUR_FIREBASE_API_KEY' ||
    authDomain === 'YOUR_PROJECT.firebaseapp.com' ||
    projectId === 'YOUR_FIREBASE_PROJECT_ID' ||
    appId === 'YOUR_FIREBASE_APP_ID'
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId
  };
}

function initFirebaseApp() {
  const config = getFirebaseConfig();
  if (!config || !window.firebase?.apps) {
    return null;
  }

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(config);
  }

  return window.firebase.auth();
}

function initFirestore() {
  const config = getFirebaseConfig();
  if (!config || !window.firebase?.apps || !window.firebase.firestore) {
    return null;
  }

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(config);
  }

  return window.firebase.firestore();
}

async function saveFirebaseUserProfile(idToken, fallbackProfile = {}) {
  const auth = initFirebaseApp();
  const db = initFirestore();
  if (!auth || !db || !idToken) return;

  const credential = window.firebase.auth.GoogleAuthProvider.credential(idToken);
  const result = await auth.signInWithCredential(credential);
  const user = result?.user;
  if (!user) return;

  const preferredLink = localStorage.getItem(PF_LINK_KEY) || '';
  const websiteType = localStorage.getItem(PF_PRODUCT_KEY) || '';
  const selectedTemplate = localStorage.getItem('pf-selected-template') || '';
  const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();

  const payload = {
    uid: user.uid,
    name: user.displayName || fallbackProfile.name || '',
    email: user.email || fallbackProfile.email || '',
    phoneNumber: fallbackProfile.phoneNumber || '',
    websiteName: fallbackProfile.websiteName || '',
    username: preferredLink || fallbackProfile.username || '',
    template: selectedTemplate || fallbackProfile.template || '',
    websiteType: websiteType || fallbackProfile.websiteType || '',
    isPublic: true,
    updatedAt: timestamp
  };

  await db.collection('users').doc(user.uid).set({
    ...payload,
    createdAt: timestamp
  }, { merge: true });
}

async function saveFirebaseUserProfileFromUser(user, fallbackProfile = {}) {
  const db = initFirestore();
  if (!db || !user) return;

  const preferredLink = localStorage.getItem(PF_LINK_KEY) || '';
  const category = localStorage.getItem(PF_CATEGORY_KEY) || '';
  const websiteType = localStorage.getItem(PF_PRODUCT_KEY) || '';
  const selectedTemplate = localStorage.getItem('pf-selected-template') || '';
  const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();

  const payload = {
    uid: user.uid,
    name: user.displayName || fallbackProfile.name || '',
    email: user.email || fallbackProfile.email || '',
    phoneNumber: fallbackProfile.phoneNumber || '',
    websiteName: fallbackProfile.websiteName || '',
    username: preferredLink || fallbackProfile.username || '',
    category: category || fallbackProfile.category || '',
    template: selectedTemplate || fallbackProfile.template || '',
    websiteType: websiteType || fallbackProfile.websiteType || '',
    isPublic: true,
    updatedAt: timestamp
  };

  await db.collection('users').doc(user.uid).set({
    ...payload,
    createdAt: timestamp
  }, { merge: true });
}

async function updateFirebaseUserDoc(patch = {}) {
  const db = initFirestore();
  const auth = initFirebaseApp();
  if (!db || !auth) return;
  const user = auth.currentUser;
  if (!user) return;
  const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();

  await db.collection('users').doc(user.uid).set({
    ...patch,
    updatedAt: timestamp
  }, { merge: true });
}

async function saveFirebasePaymentRecord(payload = {}) {
  const db = initFirestore();
  if (!db || !window.firebase?.firestore) {
    throw new Error('Firebase is not configured on this page.');
  }

  const storedUser = getStoredUser();
  const auth = initFirebaseApp();
  const currentUser = auth?.currentUser || null;
  const uid = currentUser?.uid || storedUser?.uid || '';

  if (!uid) {
    throw new Error('Please sign in with Google before submitting payment details.');
  }

  const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();
  const record = {
    uid,
    email: currentUser?.email || storedUser?.email || '',
    authName: currentUser?.displayName || storedUser?.name || '',
    payerName: payload.name || '',
    transactionId: payload.transactionId || '',
    upiId: payload.upiId || '',
    amount: Number(payload.amount || 0),
    currency: payload.currency || 'INR',
    plan: payload.plan || 'Pro',
    sourcePage: payload.sourcePage || '',
    status: 'submitted',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return db.collection('paymentSubmissions').add(record);
}

async function handleFirebaseLogin(user) {
  if (!user) return;
  const hasIntent = sessionStorage.getItem('pf-login-intent') === '1';
  if (!hasIntent) {
    return;
  }
  try {
    const idToken = await user.getIdToken();
    saveAuthSession(idToken, {
      uid: user.uid,
      name: user.displayName || '',
      email: user.email || ''
    });

    await saveFirebaseUserProfileFromUser(user, {
      name: user.displayName || '',
      email: user.email || ''
    });

    showToast(`Welcome, ${(user.displayName || 'there').split(' ')[0]}`);
    setTimeout(() => {
      routeAfterLogin(idToken);
    }, 300);
  } catch (error) {
    console.warn('Firebase login flow failed:', error);
    showToast('Login successful. Redirecting...');
    setTimeout(() => {
      window.location.href = 'choose.html';
    }, 300);
    }
  }

function renderFirebaseGoogleButton(container, label, auth) {
  if (!container || !auth) return;

  container.innerHTML = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'google-btn';
  button.innerHTML = `
    <span aria-hidden="true">G</span>
    <span>${label}</span>
  `;

  button.addEventListener('click', async () => {
    try {
      sessionStorage.setItem('pf-login-intent', '1');
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await auth.signInWithPopup(provider);
      await handleFirebaseLogin(result.user);
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') {
        return;
      }

      const message =
        error?.message ||
        'Firebase Google sign-in failed. Check your Firebase config.';
      showToast(message);
    }
  });

  container.appendChild(button);
}

function initGoogleAuth() {
  const signupButton = document.getElementById('googleSignupButton');
  const loginButton = document.getElementById('googleLoginButton');
  const meta = document.querySelector('meta[name="google-signin-client_id"]');
  const clientId = meta?.content || '';

  const firebaseAuth = initFirebaseApp();

  if ((!signupButton && !loginButton)) {
    return;
  }

  if (firebaseAuth) {
    if (signupButton) {
      renderFirebaseGoogleButton(signupButton, 'Continue with Google', firebaseAuth);
    }
    if (loginButton) {
      renderFirebaseGoogleButton(loginButton, 'Continue with Google', firebaseAuth);
    }
    return;
  }

  if (!window.google?.accounts?.id || !clientId) {
    showToast('Firebase config missing for Google login');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        handleGoogleAuth(response.credential);
      }
    }
  });

  [signupButton, loginButton].filter(Boolean).forEach((button) => {
    button.innerHTML = '';
    window.google.accounts.id.renderButton(button, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width: button.clientWidth || 360
    });
  });
}

window.initGoogleAuth = initGoogleAuth;

async function routeAfterLogin() {
  const currentPage = window.location.pathname.split('/').pop();
  const hasIntent = sessionStorage.getItem('pf-login-intent') === '1';
  if (currentPage === 'auth.html' && !hasIntent) {
    return;
  }
  sessionStorage.removeItem('pf-login-intent');
  try {
    const authToken = getAuthToken();
    let profile = null;
    if (authToken) {
      try {
        const result = await apiRequest('/auth/me', { token: authToken });
        profile = result?.data?.user || null;
      } catch (error) {
        profile = null;
      }
    }

    if (!profile) {
      profile = await getFirebaseUserDoc();
    }

    if (profile) {
      const hasWebsite = Boolean(profile.website || profile.dashboard);
      if (hasWebsite) {
        if (profile.dashboard) {
          window.location.href = profile.dashboard;
          return;
        }

        const preferredLink = profile.username || localStorage.getItem(PF_LINK_KEY) || '';
        const uid = profile.uid || getStoredUser()?.uid || '';
        const dashboardUrl = buildDashboardUrl(preferredLink, uid);
        if (dashboardUrl) {
          window.location.href = dashboardUrl;
          return;
        }

        const fallbackType = localStorage.getItem(PF_PRODUCT_KEY) || profile.websiteType || 'website';
        if (fallbackType === 'website') {
          const preferred = profile.username || localStorage.getItem(PF_LINK_KEY) || '';
          const uid = profile.uid || getStoredUser()?.uid || '';
          const fallbackDashboard = buildDashboardUrl(preferred, uid);
          if (fallbackDashboard) {
            window.location.href = fallbackDashboard;
            return;
          }
        }
        window.location.href = getDashboardPath(fallbackType);
        return;
      }

      window.location.href = 'choose.html';
      return;
    }

    window.location.href = 'choose.html';
  } catch (error) {
    window.location.href = 'choose.html';
  }
}

async function initAuthPage() {
  const usernameInput = document.getElementById('usernameInput');
  const authTabs = document.querySelector('[data-tab-group]');
  if (!usernameInput && !authTabs) return;

  initFirebaseApp();
  sessionStorage.removeItem('pf-login-intent');

  if (usernameInput) {
    let timer;
    usernameInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(updateUsernameAvailability, 250);
    });
  }

  initGoogleAuth();
}

document.addEventListener('DOMContentLoaded', initAuthPage);

async function initDashboardSession() {
  const sidebarName = document.getElementById('sidebarUserName');
  const sidebarHandle = document.getElementById('sidebarUserHandle');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const copyProfileButton = document.getElementById('copyProfileButton');
  const logoutButton = document.getElementById('logoutButton');
  const headerType = document.getElementById('dashboardTypeLabel');
  const storedUser = getStoredUser();
  const authToken = getAuthToken();
  const preferredLink = localStorage.getItem(PF_LINK_KEY) || 'yourname';
  const selectedProduct = localStorage.getItem(PF_PRODUCT_KEY) || 'webpage';

  if (!sidebarName || !sidebarHandle || !sidebarAvatar) return;

  if (!storedUser?.uid || !authToken) {
    clearAuthSession();
    window.location.replace('index.html');
    return;
  }

  if (storedUser?.name) {
    sidebarName.textContent = storedUser.name;
    sidebarAvatar.textContent = storedUser.name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || 'PF';
  }

  sidebarHandle.textContent = `@${preferredLink}`;

  if (headerType) {
    headerType.textContent = selectedProduct === 'website' ? 'Full Website' : 'Simple Website';
  }

  if (copyProfileButton) {
    copyProfileButton.dataset.copyLink = buildPublicUrl(preferredLink);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      const auth = initFirebaseApp();
      const finishLogout = () => {
        clearAuthSession();
        showToast('Signed out');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 250);
      };

      if (auth) {
        auth.signOut().then(finishLogout).catch(finishLogout);
      } else {
        finishLogout();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initDashboardSession);

// Profile link copy
const copyProfileButtons = document.querySelectorAll('[data-copy-link]');
copyProfileButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const link = button.dataset.copyLink || window.location.href;
    copyToClipboard(link, 'Link copied!');
  });
});


function normalizePreferredLink(value = '') {
  return value.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '');
}

async function checkPreferredLinkAvailability(preferredLink) {
  return apiRequest(`/profile/check-username/${encodeURIComponent(preferredLink)}`);
}

async function publishTemplateSelection({ preferredLink, templateId, websiteType }) {
  return apiRequest('/profile/publish-template', {
    method: 'POST',
    token: getAuthToken(),
    body: {
      username: preferredLink,
      template: templateId,
      websiteType
    }
  });
}

async function createPreferredLinkFolder(preferredLink) {
  return apiRequest('/profile/create-folder', {
    method: 'POST',
    token: getAuthToken(),
    body: { username: preferredLink }
  });
}

function initChoosePage() {
  const options = document.querySelectorAll('.choose-option');
  const continueButton = document.getElementById('continueChoice');
  const preferredLinkInput = document.getElementById('preferredLink');
  const preferredLinkStatus = document.getElementById('preferredLinkStatus');
  const phoneInput = document.getElementById('choosePhone');
  if (!options.length || !continueButton || !preferredLinkInput) return;

  let selectedProduct = localStorage.getItem(PF_PRODUCT_KEY) || 'website';
  const savedLink = localStorage.getItem(PF_LINK_KEY) || preferredLinkInput.value || 'yourname';
  preferredLinkInput.value = savedLink;
  let latestLinkCheck = 0;

  function syncSelection() {
    options.forEach((option) => {
      option.classList.toggle('active', option.dataset.product === selectedProduct);
    });
  }

  function setPreferredLinkStatus(message = '', type = '') {
    if (!preferredLinkStatus) return;
    preferredLinkStatus.textContent = message;
    preferredLinkStatus.className = 'username-status';
    if (type) {
      preferredLinkStatus.classList.add(type);
    }
  }

  async function validatePreferredLink() {
    const preferredLink = normalizePreferredLink(preferredLinkInput.value);
    preferredLinkInput.value = preferredLink;

    if (!preferredLink) {
      setPreferredLinkStatus('');
      return false;
    }

    if (preferredLink.length < 3) {
      setPreferredLinkStatus('Preferred link must be at least 3 characters', 'error');
      return false;
    }

    const requestId = Date.now();
    latestLinkCheck = requestId;
    setPreferredLinkStatus('Checking availability...', 'checking');

    try {
      const result = await checkPreferredLinkAvailability(preferredLink);
      if (latestLinkCheck !== requestId) {
        return false;
      }

      if (!result.data.available) {
        setPreferredLinkStatus(
          result.data.existingGithubPath
            ? 'This link already exists in the GitHub Pagefolio repo'
            : 'This preferred link is already taken',
          'error'
        );
        return false;
      }

      setPreferredLinkStatus('Preferred link is available', 'success');
      return true;
    } catch (error) {
      if (latestLinkCheck !== requestId) {
        return false;
      }

      setPreferredLinkStatus(error.message || 'Could not verify preferred link', 'error');
      return false;
    }
  }

  options.forEach((option) => {
    option.addEventListener('click', () => {
      selectedProduct = option.dataset.product;
      syncSelection();
    });
  });

  let validationTimer;
  preferredLinkInput.addEventListener('input', () => {
    clearTimeout(validationTimer);
    validationTimer = setTimeout(() => {
      validatePreferredLink();
    }, 250);
  });

  continueButton.addEventListener('click', async () => {
    const preferredLink = normalizePreferredLink(preferredLinkInput.value);
    const phoneNumber = phoneInput ? phoneInput.value.trim() : '';
    if (phoneInput && !phoneNumber) {
      showToast('Please add your phone number');
      phoneInput.focus();
      return;
    }
    const isAvailable = await validatePreferredLink();
    if (!isAvailable) {
      showToast('Choose an available preferred link');
      preferredLinkInput.focus();
      return;
    }

    continueButton.disabled = true;
    try {
      const updatePayload = {};
      if (phoneNumber) {
        updatePayload.phoneNumber = phoneNumber;
      }
      if (Object.keys(updatePayload).length) {
        await updateFirebaseUserDoc(updatePayload);
      }
      await createPreferredLinkFolder(preferredLink);
      localStorage.setItem(PF_PRODUCT_KEY, selectedProduct);
      localStorage.setItem(PF_LINK_KEY, preferredLink);
      showToast('Folder created. Taking you to Explore');
      setTimeout(() => {
        window.location.href = 'explore.html';
      }, 350);
    } catch (error) {
      showToast(error.message || 'Could not create folder');
    } finally {
      continueButton.disabled = false;
    }
  });

  syncSelection();
  validatePreferredLink();
}

document.addEventListener('DOMContentLoaded', initChoosePage);
document.addEventListener('DOMContentLoaded', syncDashboardLinks);

function initAdminPage() {
  const loginButton = document.getElementById('adminLoginButton');
  const refreshButton = document.getElementById('adminRefreshButton');
  const logoutButton = document.getElementById('adminLogoutButton');
  const status = document.getElementById('adminStatus');
  const listCard = document.getElementById('adminFoldersCard');
  const list = document.getElementById('adminFoldersList');
  const countLabel = document.getElementById('adminFolderCount');
  const paymentsCard = document.getElementById('adminPaymentsCard');
  const paymentsBody = document.getElementById('adminPaymentsBody');
  const paymentCountLabel = document.getElementById('adminPaymentCount');

  if (!loginButton || !status || !list || !listCard) return;

  const firebaseAuth = initFirebaseApp();
  const db = initFirestore();

  const setStatus = (message) => {
    status.textContent = message;
  };

  const isAllowedAdmin = (user) => {
    return (user?.email || '').trim().toLowerCase() === PF_ADMIN_EMAIL;
  };

  const renderFolders = (folders) => {
    list.innerHTML = '';
    if (countLabel) {
      countLabel.textContent = `${folders.length} websites`;
    }

    if (!folders.length) {
      list.innerHTML = '<p class="admin-status">No websites found.</p>';
      return;
    }

    folders.forEach((folder) => {
      const row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML = `
        <div>
          <div class="admin-row-title">${folder.name}</div>
          <div class="admin-row-links">
            <a class="admin-link" href="${folder.repoFolderUrl || folder.repoUrl}" target="_blank" rel="noreferrer">Repo folder</a>
            <a class="admin-link" href="${folder.liveUrl || folder.siteUrl}" target="_blank" rel="noreferrer">Live website</a>
            ${folder.dashboardUrl ? `<a class="admin-link" href="${folder.dashboardUrl}" target="_blank" rel="noreferrer">Dashboard</a>` : ''}
          </div>
        </div>
        <div class="admin-row-actions">
          <button class="btn btn-secondary btn-sm" data-action="delete">Delete</button>
        </div>
      `;

      row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        const confirmDelete = confirm(`Delete folder "${folder.name}"? This cannot be undone.`);
        if (!confirmDelete) return;
        setStatus('Deleting folder...');
        try {
          await apiRequest('/admin/folders/delete', {
            method: 'POST',
            token: getAuthToken(),
            body: { name: folder.name }
          });
          await loadFolders();
        } catch (error) {
          setStatus(error.message || 'Could not delete folder');
        }
      });

      list.appendChild(row);
    });
  };

  const formatPaymentDate = (value) => {
    if (!value) return 'Pending';
    try {
      const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
      if (Number.isNaN(date.getTime())) return 'Pending';
      return date.toLocaleString();
    } catch (error) {
      return 'Pending';
    }
  };

  const renderPayments = (records) => {
    if (!paymentsBody) return;

    paymentsBody.innerHTML = '';
    if (paymentCountLabel) {
      paymentCountLabel.textContent = `${records.length} records`;
    }

    if (!records.length) {
      paymentsBody.innerHTML = '<tr><td colspan="6" class="admin-status">No payment records yet.</td></tr>';
      return;
    }

    records.forEach((record) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.payerName || record.authName || '-'}</td>
        <td class="admin-payment-uid">${record.uid || '-'}</td>
        <td class="admin-payment-txn">${record.transactionId || '-'}</td>
        <td>${record.amount ? `Rs ${record.amount}` : '-'}</td>
        <td>${record.sourcePage || '-'}</td>
        <td>${formatPaymentDate(record.createdAt)}</td>
      `;
      paymentsBody.appendChild(row);
    });
  };

  const loadFolders = async () => {
    try {
      setStatus('Loading websites...');
      const response = await apiRequest('/admin/folders', { token: getAuthToken() });
      listCard.hidden = false;
      renderFolders(response.data || []);
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Could not load folders');
    }
  };

  const loadPayments = async () => {
    if (!db || !paymentsCard || !paymentsBody) return;

    try {
      const snapshot = await db
        .collection('paymentSubmissions')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      paymentsCard.hidden = false;
      renderPayments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      if (paymentCountLabel) {
        paymentCountLabel.textContent = 'Could not load';
      }
      paymentsBody.innerHTML = '<tr><td colspan="6" class="admin-status">Could not load payment records.</td></tr>';
    }
  };

  if (firebaseAuth) {
    firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        if (!isAllowedAdmin(user)) {
          clearAuthSession();
          listCard.hidden = true;
          if (paymentsCard) paymentsCard.hidden = true;
          setStatus('This Google account is not allowed to access admin.');
          await firebaseAuth.signOut().catch(() => {});
          return;
        }

        const token = await user.getIdToken();
        saveAuthSession(token, {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email || ''
        });
        await loadFolders();
        await loadPayments();
      } else {
        setStatus('Sign in to manage folders.');
      }
    });
  }

  loginButton.addEventListener('click', async () => {
    if (!firebaseAuth) {
      setStatus('Firebase is not configured.');
      return;
    }
    setStatus('Signing in...');
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await firebaseAuth.signInWithPopup(provider);
      if (!isAllowedAdmin(result.user)) {
        await firebaseAuth.signOut().catch(() => {});
        clearAuthSession();
        listCard.hidden = true;
        if (paymentsCard) paymentsCard.hidden = true;
        setStatus('Access denied. Only aadityab660@gmail.com can use admin.');
        return;
      }

      const token = await result.user.getIdToken();
      saveAuthSession(token, {
        uid: result.user.uid,
        name: result.user.displayName || '',
        email: result.user.email || ''
      });
      await loadFolders();
      await loadPayments();
    } catch (error) {
      setStatus(error.message || 'Google login failed');
    }
  });

  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      loadFolders();
      loadPayments();
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      const auth = initFirebaseApp();
      if (auth) {
        auth.signOut().finally(() => {
          clearAuthSession();
          setStatus('Signed out');
          listCard.hidden = true;
          if (paymentsCard) paymentsCard.hidden = true;
        });
      } else {
        clearAuthSession();
        setStatus('Signed out');
        listCard.hidden = true;
        if (paymentsCard) paymentsCard.hidden = true;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initAdminPage);

function getDashboardPath(productType = '') {
  return 'dashboard.html';
}

function initPricingPublishFlow() {
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage !== 'pricing.html') return;

  const state = getPostPublishState();
  const setupBanner = document.getElementById('pricingSetupBanner');
  const skipButton = document.getElementById('pricingSkipButton');
  const waitButton = document.getElementById('pricingWaitButton');
  const statusText = document.getElementById('pricingSetupStatus');
  const urlText = document.getElementById('pricingSetupUrl');
  const overlay = document.getElementById('pricingLoaderOverlay');
  const overlayTitle = document.getElementById('pricingLoaderTitle');
  const overlayStatus = document.getElementById('pricingLoaderStatus');
  const overlayHint = document.getElementById('pricingLoaderHint');
  const openButton = document.getElementById('pricingOpenDashboardButton');
  const waitCard = document.getElementById('pricingWaitCard') || setupBanner;
  const waitStatus = document.getElementById('pricingWaitStatus');
  const waitContinueButton = document.getElementById('pricingWaitContinueButton');
  const waitHideButton = document.getElementById('pricingWaitHideButton');

  if (!state?.dashboardUrl) return;

  if (setupBanner) {
    setupBanner.hidden = false;
  }
  if (statusText) {
    statusText.textContent = 'Your website is still being published. Keep this page open and we will move you automatically the moment it goes live.';
  }
  if (urlText) {
    urlText.textContent = state.websiteUrl || state.dashboardUrl;
  }

  let overlayActive = false;
  let isRedirecting = false;
  let pollTimer = null;
  let messageTimer = null;
  let autoOverlayTimer = null;
  let pollCount = 0;
  const loadingMessages = [
    'Doing the magic behind the curtain...',
    'Waking up your dashboard on GitHub Pages...',
    'Stretching the layout and polishing the pixels...',
    'Almost there. Just waiting for the live page to answer...'
  ];

  const setOverlayMessage = (message) => {
    if (overlayStatus) {
      overlayStatus.textContent = message;
    }
    if (waitStatus) {
      waitStatus.textContent = message;
    }
  };

  const setOverlayVisible = (visible) => {
    if (!overlay) return;
    overlay.hidden = !visible;
    document.body.classList.toggle('pricing-loading', visible);
    overlayActive = visible;
  };

  const setWaitCardVisible = (visible) => {
    if (!waitCard) return;
    waitCard.hidden = !visible;
  };

  const openDashboard = () => {
    if (isRedirecting) return;
    isRedirecting = true;
    clearPostPublishState();
    window.location.href = state.dashboardUrl;
  };

  const checkDashboardReady = async () => {
    try {
      const response = await fetch(`${state.dashboardUrl}${state.dashboardUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const handleReady = () => {
    if (pollTimer) clearInterval(pollTimer);
    if (messageTimer) clearInterval(messageTimer);
    if (autoOverlayTimer) clearTimeout(autoOverlayTimer);
    setWaitCardVisible(false);
    if (statusText) {
      statusText.textContent = 'Your dashboard is live. Opening it now...';
    }
    if (overlayTitle) {
      overlayTitle.textContent = 'Dashboard is ready';
    }
    if (overlayHint) {
      overlayHint.textContent = 'Taking you there now.';
    }
    setOverlayMessage('Everything is live. Opening your editor...');
    setOverlayVisible(true);
    setTimeout(openDashboard, 900);
  };

  const pollUntilReady = async () => {
    if (isRedirecting) return;
    const ready = await checkDashboardReady();
    if (ready) {
      handleReady();
      return;
    }

    pollCount += 1;
    setOverlayMessage(loadingMessages[pollCount % loadingMessages.length]);
    if (overlayHint) {
      overlayHint.textContent = overlayActive
        ? 'We will move you in the moment the page goes live.'
        : 'You can keep browsing pricing while we keep checking in the background.';
    }
  };

  const startOverlay = () => {
    if (overlayTitle) {
      overlayTitle.textContent = 'Loading your dashboard';
    }
    setOverlayVisible(true);
    setOverlayMessage(loadingMessages[pollCount % loadingMessages.length]);
    if (overlayHint) {
      overlayHint.textContent = 'We will move you in the moment the page goes live.';
    }
  };

  const handleSkipAttempt = async () => {
    const ready = await checkDashboardReady();
    if (ready) {
      handleReady();
      return;
    }

    if (statusText) {
      statusText.textContent = 'Please wait. We will take you to your dashboard in a sec.';
    }
    setWaitCardVisible(true);
    startOverlay();
    pollUntilReady();
  };

  skipButton?.addEventListener('click', () => {
    handleSkipAttempt();
  });

  waitButton?.addEventListener('click', () => {
    startOverlay();
    pollUntilReady();
  });

  waitContinueButton?.addEventListener('click', () => {
    startOverlay();
    pollUntilReady();
  });

  waitHideButton?.addEventListener('click', () => {
    setWaitCardVisible(false);
  });

  openButton?.addEventListener('click', () => {
    openDashboard();
  });

  autoOverlayTimer = setTimeout(() => {
    if (!overlayActive && !isRedirecting) {
      startOverlay();
    }
  }, 7000);

  messageTimer = setInterval(() => {
    if (isRedirecting) return;
    pollCount += 1;
    setOverlayMessage(loadingMessages[pollCount % loadingMessages.length]);
  }, 3500);

  pollUntilReady();
  pollTimer = setInterval(pollUntilReady, 3500);
}

document.addEventListener('DOMContentLoaded', initPricingPublishFlow);

function initDashboardRouting() {
  const currentPage = window.location.pathname.split('/').pop();
  const selectedProduct = localStorage.getItem(PF_PRODUCT_KEY) || 'webpage';
  const expectedPage = getDashboardPath(selectedProduct);
  
  if (
    currentPage === 'dashboard.html' &&
    currentPage !== expectedPage &&
    selectedProduct !== 'website'
  ) {
    window.location.replace(expectedPage);
  }
}

document.addEventListener('DOMContentLoaded', initDashboardRouting);



