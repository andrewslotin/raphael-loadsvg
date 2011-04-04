Raphael.fn.loadSVG = function (url, layer, options) {
    var me = this;

    options = options || {};

    function parseStyle(style) {
        var attrs = {};

        $.each(style.split(/\s*;\s*/), function (i, attr) {
            var chunks = attr.split(/\s*:\s*/, 2);
            attrs[chunks[0]] = chunks[1];
        });

        return attrs;
    }

    function processLinearGradient($node, $doc) {
        var attrs = {};

        if ($node.attr('xlink:href')) {
            attrs = processLinearGradient($($node.attr('xlink:href'), $doc), $doc);
        }

        var vector = {
            x: ($node.attr('x2') || 0) - ($node.attr('x1') || 0),
            y: ($node.attr('y2') || 0) - ($node.attr('y1') || 0)
        };

        attrs.angle = (360 + Math.atan(vector.y / vector.x) * 180 / Math.PI) % 360;

        var stops = {}, offsets = [];
        $('stop', $node).each(function (i, el) {
            var $el    = $(el),
                offset = parseFloat($el.attr('offset') || 0) * 100,
                style = parseStyle($el.attr('style'));

            stops[offset] = { color: style['stop-color'], offset: offset };
            if (style.hasOwnProperty('stop-opacity')) {
                var rgb = me.raphael.getRGB(stops[offset].color);
                stops[offset].color = 'rgba(' + [ rgb.r, rgb.g, rgb.b, parseFloat(style['stop-opacity']) ].join(',') + ')';
            }
            offsets.push(offset);
        });

        if (offsets.length) {
            attrs.stops = [];
            offsets.sort();

            for (var i = 0, l = offsets.length; i < l; i++) {
                attrs.stops.push(stops[offsets[i]]);
            }
        }

        return attrs;
    }

    function processGradientNode($node, $doc) {
        var attrs;

        if ($node[0].nodeName == 'linearGradient') {
            attrs = processLinearGradient($node, $doc);
            return ([ attrs.angle ].concat($.map(attrs.stops, function (stop, i) {
                return stop.color + ((i == 0 || i == attrs.stops.length - 1) ? '' : ':' + stop.offset);
            })).join('-'));
        } else if ($node[0].nodeName == 'radialGradient') {
            return ''
        } else {
            throw new Error('Invalid gradient node name: ' + $node[0].nodeName);
        }
    }

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

                $.extend(attrs, parseStyle(style));

                if (/url\("?(#[^\)]+)"?\)/.exec(attrs.fill)) {
                    var g = processGradientNode($(RegExp.$1, $root), $(svg));

                    if (g) {
                        attrs['fill'] = g;
                    } else {
                        delete attrs['fill'];
                    }
                }

                if (! attrs.hasOwnProperty('stroke')) {
                    attrs.stroke = 'none';
                }

                $.each(($el.attr('transform') || '').split(/\s+/), function (i, trans) {
                    if (/(matrix|rotate|scale|translate)\(((?:[^,]+,)*[^,]+)\)/gi.exec(trans)) {
                        transform += RegExp.$1[0] + RegExp.$2;
                    }
                });

                var shape = me[el.nodeName].call(me, $(el).attr('d') ? [ $(el).attr('d').replace(/\s{2,}/g, ' ') ] : []);

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