document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const registerView = document.getElementById('register-view');
  const loginView = document.getElementById('login-view');
  const profileView = document.getElementById('profile-view');

  const goToLoginLink = document.getElementById('go-to-login');
  const goToRegisterLink = document.getElementById('go-to-register');

  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  const registerError = document.getElementById('register-error');
  const registerSuccess = document.getElementById('register-success');
  const loginError = document.getElementById('login-error');
  const loginSuccess = document.getElementById('login-success');

  const logoutBtn = document.getElementById('logout-btn');

  // Init password toggles
  setupPasswordToggles();

  // Navigation Links
  goToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('login');
  });

  goToRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('register');
  });

  // Check existing session
  checkAuthStatus();

  // Registration Form Handler
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const shopName = document.getElementById('reg-shop-name').value.trim();
    const ownerName = document.getElementById('reg-owner-name').value.trim();
    const gstin = document.getElementById('reg-gstin').value.trim();
    const mobileRaw = document.getElementById('reg-mobile').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    // Basic Validation
    if (!shopName || !ownerName || !mobileRaw || !email || !password) {
      showError(registerError, 'All required fields must be filled.');
      return;
    }

    if (shopName.length < 3) {
      showError(registerError, 'Shop name must be at least 3 characters.');
      return;
    }

    if (ownerName.length < 2) {
      showError(registerError, 'Owner name must be at least 2 characters.');
      return;
    }

    // Format mobile for backend (+91 prefix if not present)
    let mobile = mobileRaw.replace(/\s+/g, '');
    if (!mobile.startsWith('+') && !mobile.startsWith('91')) {
      mobile = '+91' + mobile;
    } else if (mobile.startsWith('91') && !mobile.startsWith('+')) {
      mobile = '+' + mobile;
    }

    const mobileRegex = /^\+?[0-9]{10,15}$/;
    if (!mobileRegex.test(mobile)) {
      showError(registerError, 'Please enter a valid mobile number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError(registerError, 'Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      showError(registerError, 'Password must be at least 8 characters long.');
      return;
    }

    if (gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
      if (!gstinRegex.test(gstin)) {
        showError(registerError, 'Invalid GSTIN format. E.g. 22AAAAA0000A1Z5');
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopName,
          ownerName,
          gstin: gstin || undefined,
          mobile,
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(registerSuccess, 'Registration successful! Redirecting to sign in...');
        registerForm.reset();
        setTimeout(() => {
          switchView('login');
        }, 2000);
      } else {
        showError(registerError, data.error || 'Registration failed.');
      }
    } catch (err) {
      showError(registerError, 'Network error. Please check your connection.');
    }
  });

  // Login Form Handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const identifierRaw = document.getElementById('log-identifier').value.trim();
    const password = document.getElementById('log-password').value;

    if (!identifierRaw || !password) {
      showError(loginError, 'Mobile/Email and password are required.');
      return;
    }

    // Format mobile if the identifier looks like a phone number (e.g. starts with + or contains only digits)
    let identifier = identifierRaw.replace(/\s+/g, '');
    const isPhone = /^[0-9+]+$/.test(identifier);
    if (isPhone && !identifier.startsWith('+') && !identifier.startsWith('91')) {
      identifier = '+91' + identifier;
    } else if (isPhone && identifier.startsWith('91') && !identifier.startsWith('+')) {
      identifier = '+' + identifier;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(loginSuccess, 'Login successful! Entering dashboard...');
        loginForm.reset();
        
        // Wait a brief moment for the animation and transition
        setTimeout(() => {
          checkAuthStatus();
        }, 1000);
      } else {
        showError(loginError, data.error || 'Invalid credentials.');
      }
    } catch (err) {
      showError(loginError, 'Network error. Please check your connection.');
    }
  });

  // Logout Handler
  logoutBtn.addEventListener('click', () => {
    // Clear cookies by setting expired date (HttpOnly cannot be cleared from JS, so we fetch standard logout route, or just set it from frontend if not HttpOnly.
    // Wait, the client cannot delete HttpOnly cookies. We should offer a logout route in backend or let backend set the cookie expiration to past!)
    // Let's call the backend logout endpoint if it exists, or clear client side state and redirect.
    // We will implement a quick logout endpoint in backend `/api/auth/logout` that clears the cookie, or we can just reload the page after doing it.
    // Let's fetch a backend logout or just try to clear it, and redirect.
    // Let's check: if we create a logout endpoint it is extremely clean!
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      // Clear token from cookie on client if it wasn't HttpOnly (just in case)
      document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.reload();
    });
  });

  // Switch View Helper
  function switchView(view) {
    hideAlerts();
    if (view === 'login') {
      registerView.style.display = 'none';
      profileView.style.display = 'none';
      loginView.style.display = 'block';
    } else if (view === 'register') {
      loginView.style.display = 'none';
      profileView.style.display = 'none';
      registerView.style.display = 'block';
    } else if (view === 'profile') {
      loginView.style.display = 'none';
      registerView.style.display = 'none';
      profileView.style.display = 'block';
    }
  }

  // Check Auth Status Helper
  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        // Since profile details contains ID and username/shopName, let's fetch full details.
        // Wait, the profile endpoint returns req.user which has id, username, email, etc.
        // Let's populate the profile view using textContent to prevent XSS.
        const user = data.user;
        
        document.getElementById('prof-shop-name').textContent = user.shopName || user.username || 'N/A';
        document.getElementById('prof-owner-name').textContent = user.ownerName || 'N/A';
        document.getElementById('prof-email').textContent = user.email || 'N/A';
        document.getElementById('prof-mobile').textContent = user.mobile || 'N/A';
        
        const gstinEl = document.getElementById('prof-gstin');
        const gstinWrapper = document.getElementById('prof-gstin-wrapper');
        if (user.gstin) {
          gstinEl.textContent = user.gstin;
          gstinWrapper.style.display = 'block';
        } else {
          gstinWrapper.style.display = 'none';
        }

        // Initials avatar
        const shop = user.shopName || user.username || 'ST';
        document.getElementById('profile-initials').textContent = shop.substring(0, 2).toUpperCase();

        switchView('profile');
      } else {
        switchView('login');
      }
    } catch (err) {
      switchView('login');
    }
  }

  // Password Visibility Toggle Setup
  function setupPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        const openIcon = toggle.querySelector('.eye-open-icon');
        const closedIcon = toggle.querySelector('.eye-closed-icon');

        if (input.type === 'password') {
          input.type = 'text';
          openIcon.style.display = 'none';
          closedIcon.style.display = 'block';
        } else {
          input.type = 'password';
          openIcon.style.display = 'block';
          closedIcon.style.display = 'none';
        }
      });
    });
  }

  // Alert Helpers
  function showError(element, msg) {
    element.textContent = msg;
    element.style.display = 'block';
  }

  function showSuccess(element, msg) {
    element.textContent = msg;
    element.style.display = 'block';
  }

  function hideAlerts() {
    registerError.style.display = 'none';
    registerSuccess.style.display = 'none';
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
  }
});
