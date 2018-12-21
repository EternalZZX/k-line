$(function () {
  var username = $('.username');
  var password = $('.password');
  var errorMessage = $('.error-msg');
  var loginButton = $('.btn-login');

  $("#carousel_3").FtCarousel({
    index: 0,
    auto: true,
    time: 3000,
    indicators: false,
    buttons: true
  });

  localStorage.removeItem('id');
  localStorage.removeItem('username');
  localStorage.removeItem('lastlogin');
  localStorage.removeItem('sys_name');
  localStorage.removeItem('logo_image');

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
    var category = $('.current').data('category');
    $.get({
      url: "http://api.fderivatives.com/api/account/login",
      type: 'get',
      dataType: 'jsonp',
      data: {
        username: $(username[category - 1]).val(),
        password: hex_md5($(password[category - 1]).val()),
        category: category
      },
      success: function (data) {
        if (data.code) {
          localStorage.setItem('id', data.data.id);
          localStorage.setItem('username', data.data.username);
          localStorage.setItem('lastlogin', data.data.lastlogin);
          localStorage.setItem('sys_name', data.data.sys_name);
          localStorage.setItem('logo_image', data.data.logo_image);
          window.location.href = 'index.html';
        } else {
          errorMessage.show();
        }
      }
    });
  }
});