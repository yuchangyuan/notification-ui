var _test = {};

_test.add_notification = function() {
    _n.create({
        'command': 'create',
        'uuid': 'e4c9b371-2271-492d-a55c-daae76467262',
        'timestamp': new Date().getTime(),
        'title': 'This title 1',
        'body': "<p>this is paragraph1</p><p>this is paragraph2</p>" +
            "<button>button1</button></p>",
        'notification_class': ['low-urgency'],
        'client': 'test1'
    }, "local");
    _n.create({
        'command': 'create',
        'uuid': 'e4c9b371-2271-492d-a55c-daae76467262',
        'timestamp': new Date().getTime(),
        'title': '这是标题',
        'body': "<p>中文测试～～</p>",
        'notification_class': ['critical-urgency'],
        'client': 'test1'
    }, "local");
    
    _n.create({
        'command': 'create',
        'uuid': '80e5cb82-b30d-455c-97cb-79eb7d1af10a',
        'timestamp': new Date().getTime(),
        'title': "Test1",
        'client': 'test'
    }, "local");
}
