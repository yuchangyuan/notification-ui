var _n = {};

// notification data
_n.data = {};

_n.window_reset = function() {
    window.moveTo(window.screen.width - 440, 20);
}

_n.window_fit = function() {
    var h = document.body.offsetHeight + 5;
    var h_max = window.screen.height - 40;
    if (h > h_max) h = h_max;
    window.resizeTo(430, h);

    if ($('div.notification').size() == 0) {
        _n.window_show(false);
        $('div.toolbar').css('opacity', '0.25');
        _n.focus_event_deactive();
    }
    else {
        _n.window_show(true);
    }
}

_n.window_show = function(vis) {
    if (window.bridge === undefined) {
        window.bridge = {};
        window.bridge.setVisible = function(visible) {
        };
    }

    window.bridge.setVisible(vis);
}


_n.create = function(c, src) {
    /* check */
    if (c.command != "create") return false;
    if ((c.uuid === undefined) ||
        (c.timestamp === undefined) ||
        (c.client === undefined) ||
        (c.title === undefined)) return false;

    // TODO: do security check for argument,
    // especially to avoid inline script

    // hack
    if (c.title_class === undefined) c.title_class = [];
    if (c.body_class === undefined) c.body_class = [];
    if (c.notification_class === undefined) c.notification_class = [];

    if (!$.isArray(c.title_class) ||
        !$.isArray(c.body_class) ||
        !$.isArray(c.notification_class)) return false;

    // save to _n.data
    var data = {};
    for (var key in c) {
        data[key] = c[key];
    }
    delete data.command;
    data.src = src;
    _n.data[c.uuid] = data;

    // create top div
    var ndiv_class = ["notification"];
    if ($.isArray(c.notification_class)) {
        ndiv_class = ndiv_class.concat(c.notification_class);
    }
    var ndiv = $("<div></div>");
    ndiv.attr("id", c.uuid);
    ndiv.attr("class", ndiv_class.join(" "));

    // add close button
    var nclose = $("<button class='close-button'></button>");
    nclose.click(function() {
        ndiv.hide("fast", function() {
            _n.close({'command': 'close',
                      'uuid': c.uuid,
                      'reason': 2, // dismissed by user
                      'timestamp': new Date().getTime()});
        });
    });
    ndiv.append(nclose);

    // add title
    var ntitle_class = ["notification-title"];
    if ($.isArray(c.title_class)) {
        ntitle_class = ntitle_class.concat(c.title_class);
    }
    var ntitle = $("<div></div>");
    ntitle.attr("class", ntitle_class.join(" "));
    ntitle.append(c.title);
    ndiv.append(ntitle);

    // add body
    if (c.body !== undefined) {
        var nbody_class = ['notification-body'];
        if ($.isArray(c.body_class)) {
            nbody_class = nbody_class.concat(c.body_class);
        }
        var nbody = $("<div></div>");
        nbody.attr("class", nbody_class.join(" "));
        nbody.append(c.body);

        // replace button id
        $("button", nbody).each(function (i) {
            var id = $(this).attr("id");
            if (id === "") { id = "__button" + i; }
            id = c.uuid + "_" + id;
            $(this).attr("id", id);
        });

        // replace link
        $("a", nbody).each(function (i) {
            var id = $(this).attr("id");
            if (id === "") { id = "__a" + i; }
            id = c.uuid + "_" + id;
            $(this).attr("id", id);
        });

        ndiv.append(nbody);
    }

    // add status
    var nstatus = $("<div class='notification-status'></div>");
    nstatus.append("<span>" + src + " - " + c.client + "</span>");
    nstatus.append("<span style='position:absolute; right: 1em;'>" +
                   new Date(c.timestamp).toISOString() +
                   "</span>");
    ndiv.append(nstatus);

    // add to body
    $('body div:first').after(ndiv);
    _n.window_fit();
    ndiv.hide();
    ndiv.show("fast", function() {
        _n.window_fit();
    });
}


_n.update = function(c) {
    /* check */
    if (c.command != "update") return false;
    if ((c.uuid === undefined) ||
        (c.timestamp === undefined)) return false;

    // TODO: security check

    // get top div
    var ndiv = $("div#" + c.uuid);
    if (ndiv.size() == 0) return false;

    // update div class
    if ($.isArray(c.notification_class)) {
        var ndiv_class = ["notification"].concat(c.notification_class);
        ndiv.attr("class", ndiv_class.join(" "));
        _n.data[c.uuid].notification_class = c.notification_class;
    }

    // update title class
    var ntitle = $("div.notification-title", ndiv);
    if (ntitle.size() == 0) return false;
    if ($.isArray(c.title_class)) {
        ntitle_class = ["notification-title"].concat(c.title_class);
        ntitle.attr("class", ntitle_class.join(" "));
        _n.data[c.uuid].title_class = c.title_class;
    }

    // update title
    if (c.title !== undefined) {
        ntitle.empty();
        ntitle.append(c.title);
        _n.data[c.uuid].title = c.title;
    }

    // update body
    var nbody = $("div.notification-body", ndiv);

    if (c.body !== undefined) {
        if (nbody.size() == 0) {
            nbody = $("<div></div>");
            nbody.attr("class", "notification-body");
            // add to ndiv
            ntitle.after(nbody);
        }

        nbody.empty();
        nbody.append(c.body);
        _n.data[c.uuid].body = c.body;

        // replace button id
        $("button", nbody).each(function (i) {
            var id = $(this).attr("id");
            if (id === "") { id = "__button" + i; }
            id = c.uuid + "_" + id;
            $(this).attr("id", id);
        });

        // replace link
        $("a", nbody).each(function (i) {
            var id = $(this).attr("id");
            if (id === "") { id = "__a" + i; }
            id = c.uuid + "_" + id;
            $(this).attr("id", id);
        });
    }

    if ($.isArray(c.body_class)) {
        if (nbody.size() > 0) {
            var nbody_class = ['notification-body'].concat(c.body_class);
            nbody.attr("class", nbody_class.join(" "));
            _n.data[c.uuid].body_class = c.body_class;
        }
    }

    // update status
    var nstatus = $("div.notification-status", ndiv);
    $("span:last", nstatus).remove();
    nstatus.append("<span style='position:absolute; right: 1em;'>" +
                   new Date(c.timestamp).toISOString() +
                   "</span>");
    _n.data[c.uuid].timestamp = c.timestamp;

    _n.window_fit();
}


_n.close = function(c) {
    if (c.command != "close") return false;
    if ((c.uuid === undefined) ||
        (c.timestamp === undefined)) return false;

    if (c.reason == undefined) c.reason = 4;

    // send event
    if (_n.data[c.uuid] !== undefined) {
        var url = _n.data[c.uuid].src;
        if (_s.socket[url] !== undefined) {
            _s.socket[url].send(JSON.stringify({
                'event': 'closed',
                'uuid': c.uuid,
                'reason': c.reason
            }));
        }
    }

    $("div#" + c.uuid).hide("fast", function() {
        $(this).remove();
        delete _n.data[c.uuid];
        _n.window_fit();
    });
};

_n.focus_event_active = function() {
    if (_n.focus_event_id === undefined) {
        _n.focus_event_tick();
        _n.focus_event_id = window.setInterval(_n.focus_event_tick, 1000);
    }
};

_n.focus_event_deactive = function() {
    if (_n.focus_event_id !== undefined) {
        window.clearInterval(_n.focus_event_id);
        delete _n.focus_event_id;
    }
}

_n.focus_event_tick = function() {
    console.log("tick --");

    for (var url in _s.socket) {
        _s.socket[url].send(JSON.stringify({'event': 'focused'}));
    }
}

_n.init_toolbar = function() {
    var toolbar = $('div.toolbar');

    toolbar.css('opacity', '0.25');

    $('body').hover(function() {
        console.log(".. mouse in");
        toolbar.css('opacity', '1.0');
        _n.focus_event_active();
    }, function() {
        console.log(".. mouse out");
        toolbar.css('opacity', '0.25');
        _n.focus_event_deactive();
    });

};

$(function() {
    _n.window_reset();
    _n.window_fit();

    _n.init_toolbar();

    if (window.websocket !== undefined) {
        window.websocket.connectAll();
    }
    else {
        _s.add_src("ws://127.0.0.1:7755");
    }
});
