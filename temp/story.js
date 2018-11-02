$(function () {

    var packetModel = new Model('packet-model'),
        ruleModel = new Model('rule-model'),
        messageModel = new Model('message-model'),
        loadingModel = new Model('loading-model', false),
        nickItem = new FormItem('nick-input', [
            { msg: '请输入', focus: true }
        ]),
        yearItem = new FormItem('year-input', [
            { msg: '请输入', focus: true },
            { msg: '请输入', reg: /^[0-9]$/, focus: true }
        ]),
        storyItem = new FormItem('story-input', [
            { msg: '请至少输入50个字符', reg: /^[\s\S]{50,}$/, focus: true }
        ], 'textarea'),
        hopeItem = new FormItem('hope-input', [
            { msg: '请至少输入50个字符', reg: /^[\s\S]{50,}$/, focus: true }
        ], 'textarea'),
        imageItems = [
            new Upload('image-input-1', 'image-input'),
            new Upload('image-input-2', 'image-input'),
            new Upload('image-input-3', 'image-input'),
        ],
        packetButton = $('#packet-btn'),
        ruleButton = $('#rule-btn'),
        submitButton = $('#submit-btn');

    new Preload([
        'images/dialog-bg-1.png',
        'images/dialog-bg-2.png',
        'images/dialog-bg-3.png',
        'images/packet.png',
        'images/button-bg.png'
    ]);

    submitButton.click(function () {
        if (!nickItem.validate() ||
            !yearItem.validate() ||
            !storyItem.validate() ||
            !hopeItem.validate()) {
            return;
        }
        if (!uploadValidate()) {
            imageItems[0].error('...');
            return;
        }
        var formData = new FormData();
        formData.append('userName', nickItem.value());
        formData.append('year', yearItem.value());
        formData.append('story', storyItem.value());
        formData.append('hope', hopeItem.value());
        imageItems.forEach(function (item, index) {
            item.file() && formData.append('files[' + index + ']', item.file());
        });
        loadingModel.open();
        $.ajax({
            url: '/web/',
            method: 'POST',
            processData: false,
            contentType: false,
            dataType: 'json',
            data: formData,
            success: function (data) {
                loadingModel.close();
                if (data.errorCode === 0) {
                    packetModel.open();
                } else if (data.errorCode === 2 || data.errorCode === 3) {
                    messageModel.open('...');
                } else {
                    messageModel.open(data.errorMessage);
                }
            },
            error: function () {
                loadingModel.close();
                messageModel.open('...');
            }
        });
    });
    
    ruleButton.click(function () {
        ruleModel.open();
    });

    var uploadValidate = function () {
        var isUpload = false;
        imageItems.forEach(function (item) {
            item.file() && (isUpload = true);
        });
        return isUpload;
    }
});
