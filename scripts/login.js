$(function () {
  var username = $('#username');
  var password = $('#password');
  var errorMessage = $('#error-msg');
  var loginButton = $('#login-btn');

  localStorage.removeItem('token');

  loginButton.click(login);

  $(document).keyup(function (event) {
    if (event.keyCode === 13) {
      login();
    }
  });

  username.keyup(function () {
    errorMessage.hide();
  });

  password.keyup(function () {
    errorMessage.hide();
  });

  function login () {
    if (username.val() === 'admin' &&
      password.val() === 'admin') {
      window.location.href = 'index.html';
      localStorage.setItem('token', new Date().getTime());
    } else {
      errorMessage.show();
    }
  }
});