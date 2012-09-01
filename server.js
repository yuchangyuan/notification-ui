// all about server

_s = {};

// save WebSocket handler
_s.socket = {};
// save previous WebSocket readyState
_s.state = {};

_s.reconnect = function(url) {
    var socket = new WebSocket(url);
    socket.src = url; // NOTE: socket.url might not equal to url

    if (_s.socket[url] !== undefined) {
        _s.socket[url].close();
    }
    _s.socket[url] = socket;

    console.log("reconnect url = " + url);
 
    socket.onopen = function () { _s.onopen(socket); }
    socket.onmessage = function(m) { _s.onmessage(socket, m); }
    socket.onclose = function() { _s.onclose(socket); }
    socket.onerror = function() { _s.onerror(socket); }
}

_s.add_src = function(url) {    
    if (_s.socket[url] !== undefined) return;

    _s.reconnect(url);
};

_s.remove_src = function(url) {
    if (_s.socket[url] !== undefined) {
        _s.socket[url].close();
        delete _s.socket[url];
    }
};

// web socket callback
_s.onopen = function(s) {
    console.log("onopen url = " + s.url + " st: " + s.readyState);

    if (_s.socket[s.src] !== s) {
        s.close();
        return;
    }

    _s.state[s.src] = s.readyState;

    var id = _u.create('source connected',
                       s.src,
                       ['low-urgency']);

    window.setTimeout(function() { _u.close(id); }, 10 * 1000);
};

_s.onmessage = function(s, m) {
    if (_s.socket[s.src] !== s) {
        s.close();
        return;
    }
    
    // TODO
    switch (s.command) {
    case 'create':
        _n.create(m, s.src);
        break;
    case 'update':
        _n.update(m);
        break;
    case 'close':
        _n.close(m);
        break;
    case 'list':
        // initial data
        break;
    }
};

_s.onclose = function(s) {
    console.log("onclose url = " + s.src + ", st = " + s.readyState);
    s.close();

    if (_s.state[s.src] == s.OPEN) {
        var id = _u.create('source closed',
                           s.src,
                           ['critical-urgency']);
    }

    _s.state[s.src] = s.readyState;

    // reconnect after 1 sec
    window.setTimeout(function() { _s.reconnect(s.src); },
                      1000);
};

_s.onerror = function(s) {
    console.log("on error " +s );
    //s.close();

    // reconnect after 1 sec
    //window.setTimeout(function() { _s.reconnect(s.src); },
    //                 1000);
};

