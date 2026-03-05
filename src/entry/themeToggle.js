// inject js code here

const THEME_STORAGE_KEY = 'pdfmore-theme';

function isDarkTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (!saved) {
    // first time: detect from the VS Code theme class injected on <body>
    return (
      document.body.classList.contains('vscode-dark') ||
      document.body.classList.contains('vscode-high-contrast')
    );
  }
  return saved !== 'light';
}

const isDark = isDarkTheme();

const themeSwicher = document.createElement('div');
themeSwicher.id = 'themeSwitcher';
themeSwicher.textContent = isDark ? 'Dark' : 'Light';
themeSwicher.classList.add('toolbarLabel');
themeSwicher.addEventListener('click', () => {
  const classList = document.body.classList;
  if (classList.contains('theme-colors')) {
    classList.remove('theme-colors');
    themeSwicher.textContent = 'Light';
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  } else {
    classList.add('theme-colors');
    themeSwicher.textContent = 'Dark';
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  }
});

if (isDark) {
  document.body.classList.add('theme-colors');
}
document.getElementById('toolbarViewerRight').prepend(themeSwicher);
