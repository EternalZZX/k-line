
function Model (id, maskClose) {
    var _this = this;
    this.model = $('#' + id);
    this.html = $('html');
    this.body = $('body');
    this.content = $('#' + id + ' .hl-model__content');
    this.show = false;
    this.scrollTop = 0;
    maskClose !== false && this.model.click(function () {
        _this.close();
    });
    this.model.find('.hl-model__close').click(function () {
        _this.close();
    });
    this.model.find('.hl-model').click(function (event) {
        event.stopPropagation();
    });
}

Model.prototype._disableScroll = function () {
    this.scrollTop = this.html.scrollTop() || this.body.scrollTop();
    this.body.css({
        'position': 'fixed',
        'top': this.scrollTop * -1,
        'overflow': 'hidden',
        'background-size': 'cover'
    });
};

Model.prototype._enableScroll = function () {
    this.body.css({
        'position': 'static',
        'top': 'auto',
        'overflow':'auto',
        'background-size': 'contain'
    });
    this.html.scrollTop(this.scrollTop);
    this.body.scrollTop(this.scrollTop);
};

Model.prototype.open = function (message) {
    this.model.show();
    this._disableScroll();
    this.content && message && this.content.html(message);
};

Model.prototype.close = function () {
    this.model.hide();
    this._enableScroll();
    this.content && this.content.html('');
};

function FormItem (id, rules, type) {
    type = type || 'input';
    var _this = this;
    this.item = $('#' + id);
    this.input = $('#' + id + '>' + type);
    this.rules = rules || [];
    this.input.keyup(function () {
        _this.error('');
    });
}

FormItem.prototype.value = function () {
    return this.input.val();
}

FormItem.prototype.error = function (msg) {
    this.item.attr('data-error', msg);
}

FormItem.prototype.validate = function () {
    for (var i = 0, len = this.rules.length; i < len; i++) {
        if (this.rules[i].reg && !this.rules[i].reg.test(this.input.val()) ||
            !this.rules[i].reg && this.input.val() === '') {
            if (this.rules[i].focus) {
                $('html, body').animate({
                    scrollTop: this.item.offset().top - 50
                }, 300);
            }
            this.error(this.rules[i].msg);
            return false;
        }
    }
    return true;
}

function Upload (id, wrapperId) {
    var _this = this;
    this.wrapper = $('#' + wrapperId);
    this.item = $('#' + id);
    this.input = $('#' + id + '>input');
    this.image = $('#' + id + '>img');
    this.addIcon = $('#' + id + '>i.hi-add');
    this.deleteBtn = $('#' + id + '>p');
    this.typeList = ['image/png', 'image/jpeg', 'image/bmp'];
    this.input.change(function () {
        var file = _this.file();
        _this.error('');
        if (file) {
            if (_this.typeList.indexOf(file.type) === -1 &&
                file.name.indexOf('.raw') === -1) {
                _this._delete();
                _this.error('...');
                return;
            }
            _this.addIcon.hide();
            _this.input.hide();
            _this.deleteBtn.show();
            _this.image.show();
            _this.image.attr('src', URL.createObjectURL(file));
        } else {
            _this._delete();
        }
    });
    this.deleteBtn.click(function () {     
        _this.input.val('');
        _this._delete();
    })
}

Upload.prototype.file = function () {
    return this.input.get(0).files[0];
}

Upload.prototype._delete = function () {
    this.deleteBtn.hide();
    this.input.show();
    this.addIcon.show();
    this.image.hide();
    this.image.removeAttr('src');
}

Upload.prototype.error = function (msg) {
    this.wrapper.attr('data-error', msg);
}

var Preload = function (sources) {
    this.sources = sources;
    this.wrap = [];
    this.image();
}

Preload.prototype.image = function () {
    for (var i = 0; i < this.sources.length; i++) {
        this.wrap[i] = new Image();
        this.wrap[i].src = this.sources[i];
    }
}

$(function () {
    var shareData = {
        title: '...',
        description: '...',
        url: '...',
        imageUrl: '...',
        shareMenuList:['wechat_friend','wechat_friend_circle','copy_link']
    };
    var shareCommon = {
        title: shareData.title,
        link: shareData.url + '?pathfrom=wx',
        imgUrl: shareData.imageUrl
    };
    var wx_shareData_friend = $.extend({}, shareCommon);
    var wx_shareData_circle = $.extend({
        desc: shareData.description,
        type: 'link'
    }, shareCommon);

    var wxShare = function () {
        $.ajax({
            url: '...',
            type: 'get',
            dataType: 'json',
            async: true,
            success: function (data) {
                if (data.errorCode === 0) {
                    wx.config(data.result);
                    wx.ready(function () {
                        wx.onMenuShareAppMessage(wx_shareData_circle); // 分享给好友
                        wx.onMenuShareTimeline(wx_shareData_friend); // 朋友圈
                        wx.hideMenuItems({
                            menuList:['menuItem:share:qq','menuItem:share:weiboApp']
                        })
                    });
                }
            }
        })
    }
    if (isClient) {
        shareData.url += "?pathfrom=app";
    }
    if (isWechat) {
        wxShare();
    }
});