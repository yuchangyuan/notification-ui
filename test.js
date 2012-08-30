var _test = {};

_test.add_notification = function() {
    var n1 = {
        'command': 'create',
        'uuid': 'e4c9b371-2271-492d-a55c-daae76467262',
        'timestamp': new Date().getTime(),
        'title': 'This title 1',
        'body': "<p>this is paragraph1</p><p>this is paragraph2</p>" +
            "<button>button1</button></p>",
        'notification_class': ['low-urgency'],
        'client': 'test1'
    };

    var n2 = {
        'command': 'create',
        'uuid': 'dacc381d-b22a-4585-a37a-e791631b01a1',
        'timestamp': new Date().getTime(),
        'title': '这是标题',
        'body': "<p>中文测试～～</p>",
        'notification_class': ['critical-urgency'],
        'client': 'test1'
    };
    
    var n3 = {
        'command': 'create',
        'uuid': '80e5cb82-b30d-455c-97cb-79eb7d1af10a',
        'timestamp': new Date().getTime(),
        'title': "Test1",
        'client': 'test'
    };

    window.setTimeout(function () { _n.create(n1, "local"); }, 0);
    window.setTimeout(function () { _n.create(n2, "local"); }, 1000);    
    window.setTimeout(function () { _n.create(n3, "local"); }, 2000);    
}

_test.update_notification = function() {
    var up1 = {
            'command': 'update',
            'uuid': 'e4c9b371-2271-492d-a55c-daae76467262',
            'timestamp': new Date().getTime(),
            'title': "Up @ " + (new Date()).toISOString()    
    };

    var up2 = {
        'command': 'update',
        'uuid': 'dacc381d-b22a-4585-a37a-e791631b01a1',
        'timestamp': new Date().getTime(),
        'body': "<p>更新，时间<button>" + (new Date().toString()) +
            "</button></p>"
    };

    window.setTimeout(function () { _n.update(up1); }, 500);
    window.setTimeout(function () { _n.update(up2); }, 1500);

}

