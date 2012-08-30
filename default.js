var _n = {};


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
        // NOTE: for debug, should toolbar again
        window.setTimeout("_n.window_show(true);", 2000);
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


_n.create = function(c, serv) {
    /* check */
    if (c.command != "create") return false;
    if ((c.uuid === undefined) ||
        (c.timestamp === undefined) ||
        (c.client === undefined) ||
        (c.title === undefined)) return false;

    // hack
    if (c.title_class === undefined) c.title_class = [];
    if (c.body_class === undefined) c.body_class = [];
    if (c.notification_class === undefined) c.notification_class = [];

    if (!$.isArray(c.title_class) ||
        !$.isArray(c.body_class) ||
        !$.isArray(c.notification_class)) return false;    

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
        ndiv.fadeOut("fast", function() {
            $(this).remove();
            _n.window_fit();
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
    nstatus.append("<span>" + c.client + " - " + serv + "</span>");
    nstatus.append("<span style='position:absolute; right: 1em;'>" +
                   new Date(c.timestamp).toISOString() +
                   "</span>");
    ndiv.append(nstatus);

    // add to body
    $('body').prepend(ndiv);

    _n.window_fit();
}


$(function() {
    _n.window_reset();
    _n.window_fit();
});
