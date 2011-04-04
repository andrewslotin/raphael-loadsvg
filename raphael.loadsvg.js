Raphael.fn.loadSVG = function (url, layer, options) {
    var me = this;

    options = options || {};

    $.ajax({
        method: 'GET',
        url: url,
        dataType: 'xml',
        success: function (svg) {
            var $root = $('svg', $(svg));

            if (options.preserveAspectRatio) {
                scaleX = scaleY = Math.min(scaleX, scaleY);
            }

            $(svg).find('rect,polyline,circle,ellipse,path,image,text').each(function (i, el) {
                var $el = $(el),
                    style = $el.attr('style'),
                    transform = '',
                    attrs = {};

                $.each(el.attributes, function (i, attr) {
                    if (attr.name != 'style' && attr.name != 'd' && attr.name != 'transform') {
                        attrs[attr.name] = attr.value;
                    }
                });

                if (style) {
                    $.each(style.split(/\s*;\s*/), function (i, attr) {
                        var chunks = attr.split(/\s*:\s*/, 2);
                        attrs[chunks[0]] = chunks[1];
                    });
                }

                $.each(($el.attr('transform') || '').split(/\s+/), function (i, trans) {
                    if (/(matrix|rotate|scale|translate)\(((?:[^,]+,)*[^,]+)\)/gi.exec(trans)) {
                        transform += RegExp.$1[0] + RegExp.$2;
                    }
                });

                var shape = me[el.nodeName].call(me, $(el).attr('d') ? [ $(el).attr('d') ] : []);
                shape.attr(attrs);

                if (transform)
                    shape.transform(transform);

                layer.push(shape);
            });

            var bb = layer.getBBox(),
                cx = bb.x + bb.width / 2,
                cy = bb.y + bb.height / 2,
                scaleX = (options.width || bb.width) / bb.width,
                scaleY = (options.height || bb.height) / bb.height;

            // TODO: check for elements with explicitly set transformation and process them separately
            if (!isNaN(scaleX) && !isNaN(scaleY)) {
                if (options.keepAspectRatio)
                    scaleX = scaleY = Math.min(scaleX, scaleY);

                layer.scale(scaleX, scaleY, cx, cy);
            }

            layer.translate(options.x || 0, options.y || 0);

            if (typeof options.callback == 'function') {
                options.callback.apply(me, [ layer ]);
            }
//                set.forEach(function (el) {
//                    if (el.transform().length) {
//                        var el_bb = el.getBBox();
//                        el_bb.x = el.x * el.transform()[1] + el.y * el.transform()[2];
//                        el_bb.y = el.x * el.transform()[3] + el.y * el.transform()[4];
//                        el_bb.width = el.width * el.transform()[1] + el.height * el.transform()[2];
//                        el_bb.height = el.width * el.transform()[3] + el.height * el.transform()[4];
//
//                        el.matrix.translate(cx - (el_bb.x + el_bb.width / 2), cy - (el_bb.y + el_bb.height / 2));
//                        el.matrix.scale(scaleX, scaleY);
//                        el.matrix.translate(-(cx - (el_bb.x + el_bb.width / 2)), -(cy - (el_bb.y + el_bb.height / 2)));
//                    } else {
//                        el.scale(scaleX, scaleY, cx, cy);
//                    }
//                });
        }
    });
};
