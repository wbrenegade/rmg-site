function getUsers() {
  return getStorage(STORAGE_KEYS.users, []);
}

function setUsers(users) {
  setStorage(STORAGE_KEYS.users, users);
}

function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.password !== data.confirmPassword) {
      showMessage('Passwords do not match.', 'error', '#signupForm');
      return;
    }

    try {
      const newUser = await window.RMGApi.signup({
        name: data.name,
        email: data.email,
        password: data.password
      });

      setCurrentUser(newUser);
      showMessage('Account created successfully.', 'success', '#signupForm');
      setTimeout(() => window.location.href = 'account.html', 900);
    } catch (error) {
      // Local fallback keeps demo behavior when API is unavailable.
      const users = getUsers();
      const exists = users.find(user => user.email.toLowerCase() === data.email.toLowerCase());
      if (exists) {
        showMessage('An account with that email already exists.', 'error', '#signupForm');
        return;
      }

      const newUser = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password: data.password,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      setUsers(users);
      setCurrentUser({ id: newUser.id, name: newUser.name, email: newUser.email });
      showMessage(error?.message || 'Account created locally.', 'success', '#signupForm');
      setTimeout(() => window.location.href = 'account.html', 900);
    }
  });
}

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const user = await window.RMGApi.login(data);
      setCurrentUser(user);
      showMessage('Logged in successfully.', 'success', '#loginForm');
      setTimeout(() => window.location.href = 'account.html', 900);
    } catch {
      const users = getUsers();
      const user = users.find(item => item.email.toLowerCase() === data.email.toLowerCase() && item.password === data.password);

      if (!user) {
        showMessage('Invalid email or password.', 'error', '#loginForm');
        return;
      }

      setCurrentUser({ id: user.id, name: user.name, email: user.email });
      showMessage('Logged in successfully (local mode).', 'success', '#loginForm');
      setTimeout(() => window.location.href = 'account.html', 900);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSignup();
  initLogin();
});