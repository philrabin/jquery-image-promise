/**
 * Load an image with the same signature as $.ajax
 * -- if simulateAjax=true then global ajax events will fire
 * @param url {String|Object}
 * @param [options] {Object}
 * @returns {jQuery.Deferred}
 */
$.loadImage = function(url, options) {
    if(typeof url === 'object'){
        options = url;
        url = undefined;
    }

    var opts = $.extend({
        simulateAjax: false,
        global: true,
        success: $.noop,
        error: $.noop
    }, options);

    opts.url = url || options.url;

    // Define a 'worker' function that should eventually resolve or reject the deferred object.
    var loadImage = function(deferred) {
        var image = $('<img>');

        // Set up event handlers to know when the image has loaded
        // or fails to load due to an error or abort.
        image.on('load', onLoad);
        image.on('error', onError); // URL returns 404, etc
        image.on('abort', onError); // IE may call this if user clicks 'Stop'

        var callbackContext = opts.context || opts;
        // Context for global events
        // It's the callbackContext if one was provided in the options
        // and if it's a DOM node or a jQuery collection
        var globalEventContext = callbackContext !== opts &&
                (callbackContext.nodeType || callbackContext instanceof $) ?
                $(callbackContext) : $.event;

        if (opts.simulateAjax && opts.global){
            globalEventContext.trigger('ajaxSend');

            if($.active++ === 0){
                $.event.trigger('ajaxStart');
            }
        }

        // Setting the src property begins loading the image.
        image.attr('src', opts.url);

        if(image.prop('complete')){
            image.load();
        }

        function onLoad() {
            image.off();
            // Calling resolve means the image loaded successfully and is ready to use.
            deferred.resolve(image.get(0));
            deferred.done(opts.success);
            done(true);
        }

        function onError() {
            image.off();
            // Calling reject means we failed to load the image (e.g. 404, server offline, etc).
            deferred.reject(image.get(0));
            done(false);
        }

        function done(isSuccess){
            if(opts.simulateAjax && opts.global){
                globalEventContext.trigger('ajax' + (isSuccess ? 'Success' : 'Error'));
                globalEventContext.trigger('ajaxComplete');
                if(!(--$.active)) {
                    $.event.trigger('ajaxStop');
                }
            }
        }
    };

    // Create the deferred object that will contain the loaded image.
    // We don't want callers to have access to the resolve() and reject() methods,
    // so convert to 'read-only' by calling `promise()`.
    return $.Deferred(loadImage).promise();
};
