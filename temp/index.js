$(function() {
    var ruleModel = new Model('rule-model'),
        ruleButton = $('#rule-btn'),
        registButton = $('#regist-btn'),
        usernameItem = new FormItem('username-input', [
            { msg: '...'}
        ]),
        passwordItem = new FormItem('password-input', [
            { msg: '...'}
        ]),
        loginButton = $('#login-btn');

    new Preload([
        'images/dialog-bg-3.png'
    ]);

    ruleButton.click(function () {
        ruleModel.open();
    });

    loginButton.click(function () {
        if (!usernameItem.validate() ||
            !passwordItem.validate()) {
            return;
        }
        $.ajax({
            url: '/login/',
            method: 'POST',
            dataType: 'json',
            data: {
                username: usernameItem.value(),
                password: passwordItem.value()
            },
            success: function (data) {
                if (data.errorCode === 0) {
                    window.location.href = 'https://...';
                } else {
                    passwordItem.error('...');
                }
            }
        });
    });
});