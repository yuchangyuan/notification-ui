// all about server

_s = {};

// save WebSocket handler
_s.socket = {};
// save previous WebSocket state
_s.state = {};
_s.OPEN = 1;
_s.CLOSED = 2;

_s.alive = {};

_s.reconnect = function(url) {
    console.log("reconnect url = " + url);

    // avoid infinite loop
    if ((_s.socket[url] !== undefined) && (_s.state[url] == _s.OPEN)) return;

    if (window.websocket !== undefined) {
        window.websocket.create(url);
        var s = {};
        s.url = url;
        s.send = function(str) { window.websocket.send(url, str); }
        s.close = function() { window.websocket.close(url); }

        _s.socket[url] = s;
    }
    else {
        var socket = new WebSocket(url);
        socket.src = url; // NOTE: socket.url might not equal to url

        if (_s.socket[url] !== undefined) {
            _s.socket[url].close();
        }
        _s.socket[url] = socket;

        socket.onopen = function (e) { _s.onopen(url); }
        socket.onmessage = function(e) { _s.onmessage(url, e.data); };
        socket.onclose = function(e) { _s.onclose(url); }
        socket.onerror = function(e) { _s.onerror(url); }
    }
};

_s.add_src = function(url) {
    if (_s.socket[url] !== undefined) return;

    _s.reconnect(url);
};

_s.remove_src = function(url) {
    if (_s.socket[url] !== undefined) {
        var s = _s.socket[url];
        delete _s.socket[url];
        s.close();

    }
};

// web socket callback
_s.onopen = function(url) {
    console.log("onopen url = " + url);

    if (_s.socket[url] === undefined) {
        return;
    }

    _s.alive[url] = true;
    _s.state[url] = _s.OPEN;

    var id = _u.create('source connected',
                       url,
                       ['low-urgency']);

    window.setTimeout(function() { _u.close(id); }, 10 * 1000);
};

_s.onmessage = function(url, text) {
    if (_s.socket[url] === undefined) {
        return;
    }

    _s.alive[url] = true;

    if (text == "") return;

    var m = $.parseJSON(text);
    console.log("onmessage " + url + " -> " + text);

    // TODO
    switch (m.command) {
    case 'create':
        _n.create(m, url);
        break;
    case 'update':
        _n.update(m);
        break;
    case 'close':
        _n.close(m);
        break;
    case 'status':
        _n.status(m);
        break;
    }
};

_s.onclose = function(url) {
    console.log("onclose url = " + url);


    if (_s.state[url] == _s.OPEN) {
        var id = _u.create('source closed',
                           url,
                           ['critical-urgency']);
        window.setTimeout(function() { _u.close(id); }, 10 * 1000);
    }

    _s.state[url] = _s.CLOSED;

    // check url
    if (_s.socket[url] === undefined) return;

    // reconnect after 1 sec
    window.setTimeout(function() { _s.reconnect(url); },
                      1000);
};

_s.onerror = function(url) {
    console.log("on error " + url);
};


if (window.websocket !== undefined) {
    console.log("register WebSocket callback.");
    window.websocket.onOpen.connect(_s.onopen);
    window.websocket.onMessage.connect(_s.onmessage);
    window.websocket.onClose.connect(_s.onclose);
    window.websocket.onError.connect(_s.onerror);
}

$(function() {
    // check server alive every 15 sec
    window.setInterval(function() {
        console.log("check alive...");
        $.map(_s.alive, function(status, url) {
            if ((_s.state[url] == _s.OPEN) && _s.socket[url] != null) {
                if (status == false) {
                    _s.socket[url].close();
                    _s.reconnect(url);
                }
                else {
                    console.log(url + " alive.");
                    _s.alive[url] = false
                    // keep alive
                    _s.socket[url].send("");
                }
            }
        });
    }, 15 * 1000);
});
