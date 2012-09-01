// util function

_u = {};

_u.create = function(title, body, nclass) {
    var uuid = UUID.generate();
    _n.create({'command': 'create',
               'title': title,
               'body': body,
               'uuid': uuid,
               'notification_class': nclass,
               'timestamp': new Date().getTime(),
               'client': ''
              }, "local");

    return uuid;
};

_u.close = function(uuid) {
    _n.close({'command': 'close',
              'uuid': uuid,
              'timestamp': new Date().getTime()});
};

_u.url_normalize = function(url) {
    
};
