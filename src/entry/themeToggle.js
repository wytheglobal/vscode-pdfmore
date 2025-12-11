// inject js code here

const themeSwicher = document.createElement('div');
themeSwicher.id = 'themeSwitcher';
themeSwicher.textContent = 'Dark';
themeSwicher.classList.add('toolbarLabel');
themeSwicher.addEventListener('click', () => {
  const classList = document.body.classList;
  if (classList.contains('theme-colors')) {
    classList.remove('theme-colors');
    themeSwicher.textContent = 'Light';
  } else {
    themeSwicher.textContent = 'Dark';
    classList.add('theme-colors');
  }
  // vscodeInstance.postMessage({
  //   type: 'function-call',
  //   data: {
  //     method: 'toggleTheme',
  //   },
  // });
});

document.body.classList.add('theme-colors');
document.getElementById('toolbarViewerRight').prepend(themeSwicher);
