/**
 * JS library for events attach
 *
 * Events are described as a triplet:
 * event:   the event which needs to be attacched
 * element: the element where attach the event
 * function:the function to execute when event occour
 *
 *
 * data-template: define template PATH
 *      data-source: define server side script with data source for data-template
 *      data-post-template: function to be called after template has been addedd to DOM.
 *
 * data-event: event or list of events to be attacched to DOM element. Each event MUST have a function defined with data-event function.
 *             List are comma separated list of items.
 *
 *      data-event-function: function or list of functions to be called when an event is launched. List of functions are comma sepatated list of items.
 *
 * @version 1.5
 * @author Alberto De Boni
 *
 * @param {type} options
 * @param {type} callback
 * @param additional_json Object to be addedd to back end response Used for template compilation
 * @returns {eventHandle}
 * 
 * @since 0.8 Added Template loading via JS function
 *
 */
function eventHandle(options) {
    "use strict";

    var $ = jQuery;
    var json = null;
    var debug = false;
    var event = null;
    var permission_obj = null;
    var old_jsonAsync = null;
    var definedObjects = {};
    this.basedir = undefined;
    this.basedirview = undefined;
    var hbs = undefined;
    var template = undefined;
    var autostart = true;
    var additional_json = null;

    var readyEventName = "evHandle";

    if (!(this instanceof eventHandle)) {
        throw new Error("eventHandle needs to be called with the new keyword");
    }

    if (window.eventHandleIstance !== undefined && window.eventHandleIstance instanceof eventHandle) {
        return window.eventHandleIstance;
    }

    if (window.basedir != undefined && window.basedir != '') {
        this.basedir = window.basedir;
    }
    if (window.basedirview != undefined && window.basedirview != '') {
        this.basedirview = window.basedirview;
    }
    if (options !== undefined) {
        if (options.autostart !== undefined && typeof options.autostart === 'boolean') {
            autostart = options.autostart;
        }
    }
    if ($('#loading_fullscreen_spinner').length == 0) {
        $('body').append('<div class="spiner-example" id="loading_fullscreen_spinner" style="display:none">\
                <div class="spiner-overlay" id="loading_fullscreen_spinner_overlay"></div>\
                <div class="sk-spinner sk-spinner-chasing-dots" id="loading_fullscreen_spinner_dots">\
                    <div class="sk-dot1"></div>\
                    <div class="sk-dot2"></div>\
                </div>\n\
                <div id="loading_fullscreen_text">' + i18n.t('Attendere, prego...') + '</div>\
            </div>');
    }

    /**
     * Ajax closures
     *
     *
     * @returns {undefined}
     */
    function AjaxService() {
        var connection = 0;
        var callProgress = 0;
        var jsonAnswer = null;

        this.getJsonAsync = function (url, data_post, data_type, options) {

            var call;
            callProgress = 1;
            var method = (options != undefined && options.method != undefined)
                    ? options.method
                    : 'POST';
            var showloadingdialog = (options != undefined && options.showloadingdialog != undefined)
                    ? options.showloadingdialog
                    : true;
            var hideloadingdialog = (options != undefined && options.hideloadingdialog != undefined)
                    ? options.hideloadingdialog
                    : true;
            var processData = (options != undefined && options.processData != undefined)
                    ? options.processData
                    : true;
            var async = (options != undefined && options.async != undefined)
                    ? options.async
                    : true;
            var contentType = (options != undefined && options.contentType != undefined)
                    ? options.contentType
                    : 'application/x-www-form-urlencoded; charset=UTF-8';
            var basedir_ignore = (options != undefined && options.basedir_ignore != undefined)
                    ? options.basedir_ignore
                    : false;

            if (showloadingdialog) {
                $('#loading_fullscreen_spinner').show();
            }

            call = $.ajax({
                url: url,
                basedir_ignore: basedir_ignore,
                async: async,
                data: data_post,
                type: method,
                dataType: data_type,
                processData: processData,
                contentType: contentType,
                beforeSend: function (data) {
                    jsonAnswer = data;
                    callProgress = 0;
                    if (options != undefined && options.beforeSend != undefined) {
                        options.beforeSend(data);
                    }
                },
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.addEventListener("progress", function (evt) {
                        if (evt.lengthComputable) {

                            var percentuale = (evt.loaded * 100) / evt.total;
                            $('#load-singolo').css('width', (percentuale + '%')).attr('aria-valuenow', percentuale);
                            //$("#progressbar").attr({value: evt.loaded, max: evt.total});
                        }
                    }, false);
                    return xhr;
                },
                success: function (data) {
                    jsonAnswer = data
                    callProgress = 0;
                    var hideload = hideloadingdialog;
                    if (options != undefined && options.success != undefined) {
                        options.success(data);
                    }
                    if (hideload) {
                        $('#loading_fullscreen_spinner').hide();
                    }
                },
                error: function (err) {
                    //console.log(err.responseText);
                    jsonAnswer = -1;
                    callProgress = 0;
                    var hideload = hideloadingdialog;
                    if (options != undefined && options.error != undefined) {
                        options.error(err);
                    }
                    if (hideload) {
                        $('#loading_fullscreen_spinner').hide();
                    }
                    var meh = -1;
                    return (-1);
                }
            });

            return call;
        }
    }

    /**
     *
     * @param {object} options override
     * @returns {AjaxQueue object}
     *
     * @TODO lancio delle chiamate della coda in modo asincrono
     */
    function AjaxQueue(options) {
        "use strict";

        if (!(this instanceof AjaxQueue)) {
            throw new Error("AjaxQueue needs to be called with the new keyword");
        }

        // configurazione di default
        var config = {
            url: null, // url che va chiamato
            type: 'POST', // tipo di chiamata
            dataType: 'json', // datatype della chiamata
            processData: true, // processData della chiamata,
            showloadingdialog: true, // sceglie se mostrare il caricamento
            hideloadingdialog: true, // sceglie se nascondere il caricamento al completamento
            basedir_ignore: false, // opzione del json service
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8', // content type della chiamata
            maxAttempts: 3,
            callbacks: {// le varie callback
                beforeStart: function (arr_data) {}, // funzione chiamata prima del lancio della coda
                singleBeforeSend: function (data, call_data) {}, // funzione lanciata al prima del lancio di ogni chiamata
                singleSuccess: function (data, call_data) {}, // funzione lanciata al success di ogni chiamata (SUCCESS DEL GESTORE)
                singleAjaxSuccess: function (data, call_data) {}, // funzione lanciata al success di ogni chiamata (SUCCESS DI AJAX)
                singleError: function (err, call_data) {}, // funzione lanciata all'error di ogni chiamata (ERROR DEL GESTORE, richiamato solo all'ultimo tentativo)
                singleAjaxError: function (err, call_data) {}, // funzione lanciata all'error di ogni chiamata (ERROR DI AJAX)
                complete: function (arr_success, arr_error) {} // funzione lanciata al completamento di ogni chiamata
            }
        };

        var arr_calls = new Array(); // array delle chiamate
        var arr_success = new Array(); // array dei success
        var arr_error = new Array(); // array degli error

        var in_progress = false;

        var jserv = new AjaxService();/** @TODO gestire l'assenza di jSonService */

        // merge delle opzioni di default con quelle passate in fase di inizializzazione
        config = $.extend(true, {}, config, options);

        if (config.url === undefined || typeof config.url != 'string') {
            throw new Error('Url option must be defined and String type');
        }

        // funzione di aggiunta di una nuova chiamata
        this.push = function (options) {

            if (typeof options == 'object') {

                //imposto un identificativo all'oggetto della chiamata
                options.id = options.id || 'call' + arr_calls.length;

                // aggiungo l'oggetto all'array della chiamate
                arr_calls.push(options);
            } else {
                throw new Error('Option param must be object');
            }
        }

        // funzione di lancio della coda
        this.start = function () {

            // se non ci sono altre chiamate in corso e c'è almeno una chiamata nella coda
            if (!in_progress && arr_calls.length > 0) {
                // se definito lancio la funzione da lanciare prima della coda
                if (config.callbacks != undefined && $.isFunction(config.callbacks.beforeStart)) {
                    config.callbacks.beforeStart(arr_calls);
                }

                // reinizializzo gli array di successo e di errore
                arr_success = new Array();
                arr_error = new Array();

                // lancio la coda
                ajaxcall();

            } else if (arr_calls.length == 0) { // se non ci sono chiamate nella coda
                // avviso lo sviluppatore
                console.warn('No calls in queue');
            }
        }

        // funzione che lancia la singola chiamata
        var ajaxcall = function () {

            // prendo le opzioni della prima chiamata nell'elenco di quelle da eseguire
            var call = arr_calls[0];

            // imposto lo stato in corso
            in_progress = true;

            var url = call.url || config.url; // definisco l'url della chiamata
            var data_post = call.data || {}; // definisco i dati da mandare alla chiamata
            var processData = call.processData || config.processData; // definisco il processData
            var contentType = call.contentType || config.contentType; // definisco il contentType

            // lancio la chiamata
            jserv.getJsonAsync(url, data_post, config.dataType, {
                showloadingdialog: config.showloadingdialog,
                hideloadingdialog: config.hideloadingdialog,
                processData: processData,
                contentType: contentType,
                basedir_ignore: config.basedir_ignore,
                beforeSend: function (param) {
                    // se definito lancio la funzione del beforesend del config
                    if (config.callbacks != undefined && $.isFunction(config.callbacks.singleBeforeSend)) {
                        config.callbacks.singleBeforeSend(param, call);
                    }

                    // se definito lancio la funzione del beforesend della singola chiamata
                    if (call != undefined && $.isFunction(call.beforeSend)) {
                        call.beforeSend(param, call);
                    }
                },
                success: function (param) {
                    // se definito lancio la funzione del success del config
                    if (config.callbacks != undefined && $.isFunction(config.callbacks.singleAjaxSuccess)) {
                        config.callbacks.singleAjaxSuccess(param, call);
                    }

                    // se definito lancio la funzione del success della singola chiamata
                    if (call != undefined && $.isFunction(call.success)) {
                        call.success(param, call);
                    }

                    // lancio il completamento della chiamata
                    completecall(true, call, param);
                },
                error: function (param) {
                    // se definito lancio la funzione dell'error del config
                    if (config.callbacks != undefined && $.isFunction(config.callbacks.singleAjaxError)) {
                        config.callbacks.singleAjaxError(param, call);
                    }

                    // se definito lancio la funzione dell'error della singola chiamata
                    if (call != undefined && $.isFunction(call.error)) {
                        call.error(param, call);
                    }

                    // lancio il completamento della chiamata
                    completecall(false, call, param);
                }
            });
        }

        // funzione di completamento chiamata
        var completecall = function (success, call, param) {
            // aggiungo la response all'oggetto della chiamata
            call.response = param;

            // se la chiamata è andata nel success e non restituisce codici di errore
            if (success && param.error_code != undefined && param.error_code >= 0) {

                // aggiungo la chiamata all'array di quelle andate a buon fine
                arr_success.push(call);

                // se definito lancio la funzione del success del config
                if (config.callbacks != undefined && $.isFunction(config.callbacks.singleSuccess)) {
                    config.callbacks.singleSuccess(param, call);
                }

            } else { //  altrimenti se la chiamata fallisce

                // creo o aumento il contatore delle chiamate fallite sulla chiamata attuale
                if (arr_calls[0].fails === undefined) {
                    arr_calls[0].fails = 1;
                } else {
                    arr_calls[0].fails++;
                }

                // se il numero dei fail è inferiore al numero di tenetativi massimi
                if (arr_calls[0].fails < config.maxAttempts) {
                    // rilancio la chiamata
                    ajaxcall();
                    return;
                } else {
                    // altrimenti aggiungo la chiamata a quelle fallite
                    arr_error.push(call);

                    // se definito lancio la funzione dell'error del config
                    if (config.callbacks != undefined && $.isFunction(config.callbacks.singleError)) {
                        config.callbacks.singleError(param, call);
                    }
                }
            }

            // rimuovo la chiamata dall'array di quelle da fare
            // siccome vengono eseguite con l'ordinamento FIFO quella da rimuovere sarà sempre alla posizione 0
            arr_calls.splice(0, 1);

            // controllo se ci sono altre chiamate
            if (arr_calls.length > 0) {
                ajaxcall();
            } else {
                // rimuovo lo stato in corso
                in_progress = false;

                // se definito lancio la funzione del success del config
                if (config.callbacks != undefined && $.isFunction(config.callbacks.complete)) {
                    config.callbacks.complete(arr_success, arr_error);
                }
            }
        }

    }
    /**
     * 
     * 
     * 
     * @param {type} elem
     * @returns {eventHandle.templateService}
     */
    function templateService(elem) {
        var self_ = this;
        var queue = null;

        var addRemotePartial = function (name, url) {
            var options = {
                url: url,
                success: function (result, call) {
                    var ret = result;
                    Handlebars.registerPartial(call.partial_name, ret);
                },
                partial_name: name
            };
            queue.push(options);
        }

        var loadRemotePartials = function () {
            queue.start();
        }

        /**
         * Get Template
         *
         * This function load an HTML js for HandleBars
         * using a syncronous ajax request. Files are loaded
         * form filesystem.
         *
         *
         */
        this.get = function (json, callback) {

            var template_function = self.eventHandleIstance.template;
            // 
            var tplUrl = $(elem).data("template");
            var tplAlternative = $(elem).data("template-alternative");
            var _post_fields_ = $(elem).data("template-url-post");
            var _method = $(elem).data('template-post-method');

            if (_post_fields_ !== undefined) {
                var post_fields = _post_fields_.split(',');
                var post_data = {};
//                $(post_fields).each(function () {
                for (var k in post_fields) {

                    // Check for data with field name
                    var value_name = 'template-url-post-' + post_fields[k];
                    var value = $(elem).data(value_name);
                    if (value !== undefined) {
                        post_data[post_fields[k]] = value;
                    } else {
                        post_data[post_fields[k]] = $(post_fields[k]).val();
                    }
                }
//                });
            }

            /*
             * Normal URL
             */
            var evInstance = window.eventHandleIstance;
            if (evInstance.basedirview != undefined && evInstance.basedirview != '') {
                tplUrl = evInstance.basedirview + tplUrl;
            }
            if (tplUrl) {
                var ret = "";
                var opt_ajax = {
                    method: _method === undefined ? 'POST' : _method,
                    showloadingdialog: false,
                    success: function (result) {
                        ret = result;
                        callback(ret, json);
                    }
                }
                var jSonService = new AjaxService();
                if (tplAlternative === undefined || template_function === undefined) {
                    jSonService.getJsonAsync(tplUrl, post_data, 'html', opt_ajax);
                } else {
                    tplUrl = $(elem).data("template");
                    template_function(tplUrl, post_data, opt_ajax);
                }

                return ret;
            }
            return null;
        };

        /**
         *
         * @param {type} html
         * @param {type} json
         * @returns {undefined}
         */
        this.compileHtml = function (html, json, callback_function, callback_object) {
            bigcompile(html, json, callback_function, callback_object);
        }

        var prepareQueue = function (tpl, json, callback_object, callback_function) {
            var queue_option = {
                url: '',
                dataType: 'html',
                maxAttempts: 1,
                callbacks: {
                    complete: function () {
                        pdcomplete(tpl, json, callback_object, callback_function);
                    }
                }
            };
            queue = new AjaxQueue(queue_option);

        }
        /**
         * Compile handlebar template
         * 
         * This function will compile handlebar 
         * 
         * 
         * @param {type} tpl template handlebar da compilare
         * @param {type} json json con i dati da inserire nel template handlebar
         * @param {type} callback_object oggetto contenente i parametri da passare alla funzione callback_function quando viene richiamata
         * @param {type} callback_function funzione da richiamare al completamento della compilazione del template.
         * 
         * @returns {undefined}
         */
        var pdcomplete = function (tpl, json, callback_object, callback_function) {
            var doc = null;
            var template = Handlebars.compile(tpl);
            // Go back with compiled template
            if (additional_json != null) {
                if (typeof json == "string") {
                    var temp = JSON.parse(json);
                    temp.additional_json = JSON.parse(additional_json);
                    json = JSON.stringify(temp);
                } else {
                    json.additional_json = JSON.parse(additional_json);
                }
            }
            console.log('Compiling with JSON')
            console.log(json);
            callback_function(template(json), callback_object);
        }
        /**
         * 
         * 
         * 
         * 
         * @param {type} tpl HandleBar template
         * @param {type} json JSON data to fill template
         * @param {type} callback_function Function to be called once template has been pushed on DOM
         * @param {type} callback_object Object to be passed to callback_function
         * 
         * @returns {undefined}
         */
        var bigcompile = function (tpl, json, callback_function, callback_object) {
            //look for partials
            var handlebar_partial = self.eventHandleIstance.hbs;
            var parser = new DOMParser();
            var doc = parser.parseFromString(tpl, "text/html");
            var partial_count = 0;

            prepareQueue(tpl, json, callback_object, callback_function);

            $(doc).find('include').each(function () {

                var _include_blocks = $(doc).find('include').data();

                if (_include_blocks['include_path'] !== undefined) {
                    var current_path = _include_blocks['include_path'];
                    delete _include_blocks['include_path'];
                } else {

                    var _current_path = '';
                }

                var size = 0;

                // $.each(_include_blocks, function () {
                for (var k in _include_blocks) {
                    size++;
                }
                // });

                if (size > 0) {
                    var evIstance = window.eventHandleIstance;
                    var arrayCall = new Array();
                    for (let key in _include_blocks) {
                        let template = _include_blocks[key];
                        let data = {
                        };
                        if (handlebar_partial != undefined) {
                            arrayCall.push(handlebar_partial(key, template));
                        } else {
                            arrayCall.push(
                                    $.get(evIstance.basedirview + current_path + template, data, function (result, call) {
                                        var ret = result;
                                        Handlebars.registerPartial(key, ret);
                                        console.log(key);
                                    }));
                        }
                    }
                    $.when.apply($, arrayCall).then(function () {
                        pdcomplete(tpl, json, callback_object, callback_function);
                    });
                }
            });
            if ($(doc).find('include').length == 0) {
                pdcomplete(tpl, json, callback_object, callback_function);
            }
        }

        /**
         * Compile
         *
         * Compile the template and return an HTML object. This function rely on bigcompile which uses
         * partials to load portions of templates to be used
         *
         * @param json The JSON used to fill template
         * @param object The function to be called when the process is over.
         * @param 
         * 
         * @returns {template_L1.Template.elem}
         */
        this.compile = function (json, callback_function, callback_object) {
            if (json) {
                this.get(json, function (tpl, json) {
                    if (tpl) {
                        bigcompile(tpl, json, callback_function, callback_object);
                    } else {
                        //console.warn("Attempted to compile "+elem+" but no data-template url was defined");
                    }
                });
            } else {
                //console.error("JSON not passed, can't compile template");
            }
            return elem;
        };
        return this;
    }

    /**
     * JSON RPC 2.0 service
     * 
     * @param {type} events
     * @returns {undefined}
     */
    function JSONRPC() {
        var ajax = null;

        if (ajax == null) {
            var EV_istance = window.eventHandleIstance;
            ajax = EV_istance.getAjaxService();
        }

        this.request = function (ws_url, post_data, method, callback_functions) {
            var request_id = Math.floor(Math.random() * 1000);
            var RPC_Request = {
                jsonrpc: "2.0",
                method: method,
                params: post_data,
                id: request_id
            }
            callback_functions.contentType = 'application/json; charset=utf-8';
            callback_functions.beforeSend = function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa("fenice_service:4r4g0g2018!"));
            };
            // Do a request
            ajax.getJsonAsync(ws_url, JSON.stringify(RPC_Request), 'json', callback_functions);
        }
    }

    /**
     * EventHandle attach event to DOM element
     *
     *
     *
     *
     * @param {type} events
     * @returns {undefined}
     *
     */
    this.addEvent = function (events) {
        if (events.constructor === Array) {
//            $.each(events, function (key, value) {
            for (var k in events) {
                let value = events[k];
                if (value.constructor === Object) {
                    var item = Object.keys(value)[0];
                    var event = value[item];
                    var _function = value['function'];
                    if (_function.constructor === Function) {
                        $(document).on(event, item, _function);
                    }
                } else {
                    if (debug) {
                        console.log('Malformed event: skipped.');

                    }
                }
            }
            // });
        } else {
        }
    }

    var json = new AjaxService();
    var rpc = null;

//    // Should not be used...
//    if (events != undefined && events.constructor === Array) {
//        this.addEvent(events);
//    }

    this.getPermission = function () {
        return permission_obj;
    }

    this.getJSONRPC = function () {
        if (rpc == null) {
            rpc = new JSONRPC();
        }
        return rpc;
    }

    this.getAjaxService = function () {
        if (json == null) {
            json = new AjaxService();
        }
        return json;
    }

    this.getObject = function (class_, group) {
        if (class_ != undefined && group != undefined) {
            return definedObjects[class_][group];
        } else {
            return null;
        }
    }

    /* dialog errore ajax */
    var AjaxError = function (jqXHR) {
        if (jqXHR === undefined || jqXHR.statusText != 'abort') {
            commonClass.swalError(i18n.t('Oops!'), i18n.t('C\'è stato un errore durante la connessione al server!'));
        }
    }

    var event_attach_arrive = function (_this) {
        if (debug) {
            console.log('Called from Arrive event with length: ' + $(_this).length);
        }
        event_attach(_this);

    }

    var event_attach = function (_this_) {
        // check if event has functions
        if (debug) {
            console.log(_this_);
            console.log($(_this_));
        }
        $(_this_).each(function (key, val) {
            var tagname = $(this).prop("tagName");
            if (tagname !== undefined && tagname === "GEVENT") {
                var selector = $(this).data('event-selector');
                console.log('Gloabl event on selector ' + selector);
            }

            var _events = $(this).data('event');
            var _functions_ = $(this).data('event-function');
            var _name = $(this).data('element-name');
            var _no_singleton = $(this).data('no-shared');
            var _group_name = $(this).data('event-group');

            if (_functions_ !== undefined) {
                var _ev_list = _events.split(",");
                var _function_list = _functions_.split(",");
                //Check if events and functions are of same length
                if (_ev_list.length == _function_list.length) {
                    var x = 0;
                    var obj = this;
                    for (x = 0; x < _ev_list.length; x++) {
                        // Attach events when possible.

                        var obj_check = _function_list[x].split('.');
                        if (obj_check.length > 1) {
                            // Check if it's a valid class
                            if (window[obj_check[0]] !== undefined && window[obj_check[0]].constructor === Function) {
                                var callable_object = new window[obj_check[0]];
                                // Check if it's a valid method
                                if (callable_object[obj_check[1]] !== undefined && callable_object[obj_check[1]].constructor === Function) {
                                    if (debug) {
                                        console.log('Attach event ' + _ev_list[x] + " to element: " + _name + " with function: " + _function_list[x]);
                                    }
                                    if (_no_singleton !== undefined && _no_singleton == true) {
                                        // attach new object always if singleton is
                                        var callback = callable_object[obj_check[1]];
                                        if (_ev_list[x] == readyEventName) {
                                            var function_to_execute = callable_object[obj_check[1]];
                                            callback = function (e) {
                                                e.stopPropagation();
                                                function_to_execute(e);
                                            }
                                        }
                                        if (tagname !== undefined && tagname === "GEVENT") {
                                            if (selector !== undefined) {
                                                $('body').on(_ev_list[x], selector, callback);
                                            } else {
                                                if (debug) {
                                                    console.log('Can\'t attach global event as misssing selector');
                                                }
                                            }
                                        } else {
                                            $(obj).on(_ev_list[x], callback);
                                        }
                                    } else {
                                        // Send always same istance
                                        var instance = '';
                                        var object_exist = undefined;

                                        // If user has defined a group name
                                        if (_group_name === undefined) {
                                            _group_name = 'default';
                                        }
                                        // Get class
                                        instance = definedObjects[obj_check[0]];
                                        if (instance !== undefined) {
                                            // Get group
                                            if (instance[_group_name] !== undefined) {
                                                // Check if function exists in group
                                                var meth = instance[_group_name][obj_check[1]];
                                                if (meth !== undefined) {
                                                    // Attach old object
                                                    var callback = meth;
                                                    if (_ev_list[x] == readyEventName) {
                                                        var function_to_execute = meth;
                                                        callback = function (e) {
                                                            e.stopPropagation();
                                                            function_to_execute(e);
                                                        }
                                                    }
                                                    if (tagname !== undefined && tagname === "GEVENT") {
                                                        if (selector !== undefined) {
                                                            $('body').on(_ev_list[x], selector, callback);
                                                        } else {
                                                            if (debug) {
                                                                console.log('Can\'t attach global event as misssing selector');
                                                            }
                                                        }
                                                    } else {
                                                        $(obj).on(_ev_list[x], callback);
                                                    }
                                                } else {
                                                    // This method doesn't exist in instance
                                                    console.log('Object method is not defined');
                                                }
                                            } else {
                                                //Object alredy exist but within a different group
                                                var class_ = obj_check[0];
                                                var _method = obj_check[1];
                                                definedObjects[class_][_group_name] = callable_object;
                                                // Attach event
                                                var callback = definedObjects[class_][_group_name][_method];
                                                if (_ev_list[x] == readyEventName) {
                                                    var function_to_execute = definedObjects[class_][_group_name][_method];
                                                    callback = function (e) {
                                                        e.stopPropagation();
                                                        function_to_execute(e);
                                                    }
                                                }
                                                if (tagname !== undefined && tagname === "GEVENT") {
                                                    if (selector !== undefined) {
                                                        $('body').on(_ev_list[x], selector, callback);
                                                    } else {
                                                        if (debug) {
                                                            console.log('Can\'t attach global event as misssing selector');
                                                        }
                                                    }
                                                } else {
                                                    $(obj).on(_ev_list[x], callback);
                                                }
                                                delete(self.callable_object);
                                            }
                                        } else {
                                            // Create object and save
                                            var class_ = obj_check[0];
                                            var _method = obj_check[1];

                                            var oj = {};
                                            oj[_group_name] = callable_object;
                                            definedObjects[class_] = oj;
                                            // Attach event
                                            var callback = oj[_group_name][_method];
                                            if (_ev_list[x] == readyEventName) {
                                                var function_to_execute = oj[_group_name][_method];
                                                callback = function (e) {
                                                    e.stopPropagation();
                                                    function_to_execute(e);
                                                }
                                            }
                                            if (tagname !== undefined && tagname === "GEVENT") {
                                                if (selector !== undefined) {
                                                    $('body').on(_ev_list[x], selector, callback);
                                                } else {
                                                    if (debug) {
                                                        console.log('Can\'t attach global event as misssing selector');
                                                    }
                                                }
                                            } else {
                                                $(obj).on(_ev_list[x], callback);
                                            }
                                            delete(self.callable_object);
                                        }
                                    }
                                }
                            } else {
                                if (debug) {
                                    console.log("Event object method " + _function_list[x] + " is not a JS function");
                                }
                            }
                        } else {
                            if (window[_function_list[x]] !== undefined && window[_function_list[x]].constructor === Function) {
                                if (debug) {
                                    console.log('Attach event ' + _ev_list[x] + " to element" + $(obj));
                                }
                                var callback = window[_function_list[x]];
                                if (_ev_list[x] == readyEventName) {
                                    var function_to_execute = window[_function_list[x]];
                                    callback = function (e) {
                                        e.stopPropagation();
                                        function_to_execute(e);
                                    }
                                }
                                if (tagname !== undefined && tagname === "GEVENT") {
                                    if (selector !== undefined) {
                                        $('body').on(_ev_list[x], selector, callback);
                                    } else {
                                        if (debug) {
                                            console.log('Can\'t attach global event as misssing selector');
                                        }
                                    }
                                } else {
                                    $(obj).on(_ev_list[x], callback);
                                }

                            } else {
                                if (debug) {
                                    console.log("Event function " + _function_list[x] + " is not a JS function");
                                }
                            }
                        }
                    }
                } else {
                    if (debug) {
                        console.log("Unaligned event and functions");

                    }
                }
            } else {
                if (debug) {
                    console.log("Un-available functions. Skip event creation.");
                }
            }
            if (debug) {
                console.log('Lancio l\'evento evHandle su');
                console.log(this);
            }
            // Fix
            if ($(this).data('event') !== undefined) {
                var events_string = $(this).data('event');
                var event_list = events_string.split(',');
                if (event_list instanceof Array) {
                    var triggerable = this;
//                    $.each(event_list, function (key, val) {
                    for (var k in event_list) {
                        let val = event_list[k];
                        if (val === readyEventName) {
                            $(triggerable).trigger(readyEventName);
                        }
                    }
//                    });
                } else {
                    if (event_list === readyEventName) {
                        $(this).trigger(readyEventName);
                    }
                }

            }
        });
    }

    var nullCallback = function () {}


    var template_push = function (html_compiled, parameters_object) {
        var placeholder = parameters_object.placeholder;
        $(placeholder).html(html_compiled);
        if (parameters_object.callback != undefined && parameters_object.callback.constructor === Function) {
            parameters_object.callback(parameters_object);
        }
    }

    /**
     *
     * Compile template and call (eventually) call back function
     *
     *
     * @param boolean filter_data true if
     *
     * @returns {undefined}
     */
    var compile_template = function (_placeholder, res, _post_callback, filter_data) {
        if (filter_data) {
            // Get expanded_permission
            var oj = {
                _placeholder: _placeholder,
                json: res,
                _post_callback: _post_callback,
                filter_data: filter_data
            }
            permission_obj.execute(oj);
        } else {
            // Doesn't need to filter data, so compile and push HTML
            var oj = {
                placeholder: _placeholder,
                json: res,
                callback: _post_callback
            };
            var template = new templateService(_placeholder);
            //$(_placeholder).template(oj);
            template.compile(res, template_push, oj);
        }
    }
    /**
     * Load and compile a template
     * 
     * This function loads and compile templates as they arrive into DOM.
     * Compilation is Handlbar driven and follow its syntax.
     * There are some directives that has to be used to guide function behaviour, and there are some
     * drawback to pay attention.
     * 
     * Directives:
     * 
     * data-template: defines where to load a template. Could be an URL or a function.
     *                - If URL be carefull that URL with a single . like http://internet.one/function/ will be treated as functions.
     *                - If function be sure that the function is SYNCRONOUS (i.e no ajax call and callback has to be used) as there's no way
     *                  for plugin to know when data are available
     *                  
     * data-template-source: defines where load data to fill 
     * data-template-post:
     * data-template-post-<value>
     * 
     * @param {type} _this_
     * @returns {undefined}
     * 
     */
    this.template_attach = function (_this_) {
        console.log('Event attach event');
        $(_this_).each(function (key, val) {
            var _placeholder = this;
            var _template_ = $(this).data('template');
            var _data_source_ = $(this).data('template-source');
            var _method = $(this).data('template-method');
            var _show_loading_source_ = $(this).data('template-source-show-loading');
            var _post_fields_ = $(this).data('template-post');
            var _post_callback = $(this).data('template-post-execute');
            var _internal_object = $(this).data('template-source-group');

            // NOT USED ON WP PLUGINS
            var _permission = $(this).data('permission-template');
            var _permission_url = $(this).data('permission-expanded_url');
            var _reference_table = $(this).data('permission-reference_table');
            var _reference_id = $(this).data('permission-id');

            var _data_alias = $(this).data('function-alias');
            if (_data_alias !== undefined) {
                /**
                 * A fucking trick to keep compatibility
                 *
                 * @todo to remove one day... maybe..
                 *
                 */
                var _alias_this_ = this;
                window[_data_alias] = function () {
                    if (debug) {
                        console.log('Create Alias Function');
                    }
                    var evIstance = window.eventHandleIstance;
                    evIstance.template_attach($(_alias_this_));
                }
            }

            if (_post_callback === undefined) {
                _post_callback = nullCallback;
            } else {
                var obj_check = _post_callback.split('.');
                if (obj_check.length > 1) {
                    var callable_object = new window[obj_check[0]];
                    if (callable_object[obj_check[1]] !== undefined && callable_object[obj_check[1]].constructor === Function) {
                        _post_callback = callable_object[obj_check[1]];
                    }
                } else {
                    if (window[_post_callback].constructor !== Function) {
                        _post_callback = nullCallback;
                    } else {
                        _post_callback = window[_post_callback];
                    }

                }
            }
            /*
             *  Only when a data source is defined the "auto" mode
             *  can proceed and load data. Otherwise is not necessary
             *  go ahead
             */
            if (_data_source_ !== undefined) {
                //
                var filter_data = false;
                if (_permission !== undefined && _permission == true) {
                    if (debug == true) {
                        console.log('Take care of permissions.')
                    }
                    // Need to take care of application permission.
                    // Initialize permission object and save attributes.
                    filter_data = true;
                    permission_obj = new localVisibility();
                    permission_obj.set('expanded_permission_url', _permission_url);
                    permission_obj.set('reference_table', _reference_table);
                    permission_obj.set('reference_id', _reference_id);
                }

                //Look for a function
                //
                var obj_check = _data_source_.split('.');
                if (obj_check.length > 1 && obj_check.length == 2) {
                    // Check if it's a valid class
                    if (window[obj_check[0]] !== undefined && window[obj_check[0]].constructor === Function) {

                        // Check if user has defined a group..
                        if (_internal_object === undefined) {
                            _internal_object = 'default';
                        }

                        var obj = definedObjects[obj_check[0]][_internal_object];
                        if (obj !== undefined) {
                            var _function = obj[obj_check[1]];
                        } else {
                            var callable_object = new window[obj_check[0]];
                            var _function = callable_object[obj_check[1]];
                            definedObjects[obj_check[0]][_internal_object] = callable_object;
                        }

                        // Execute compiling
                        var json_data = _function.call(this);
                        compile_template(_placeholder, json_data, _post_callback, filter_data);
                    }
                } else if (_data_source_.constructor === Function) {
                    // Standard function.
                    json_data = _data_source();
                    compile_template(_placeholder, json_data, _post_callback, filter_data);
                } else {
                    // Ajax Call
                    if (debug) {
                        console.log('Loading template ' + _template_);
                    }
                    /*
                     * Build post_data
                     */
                    if (_post_fields_ !== undefined) {
                        var post_fields = _post_fields_.split(',');
                        var post_data = {};
//                        $(post_fields).each(function () {
                        for (var k in post_fields) {
                            // Check for data with field name
                            var value_name = 'template-post-' + post_fields[k];
                            var value = $(_placeholder).data(value_name);
                            if (value !== undefined) {
                                post_data[post_fields[k]] = value;
                            } else {
                                post_data[post_fields[k]] = $(post_fields[k]).val();
                            }
                        }
//                        });
                    }
                    var ajax_callback = {
                        showloadingdialog: _show_loading_source_ === undefined ? true : _show_loading_source_,
                        hideloadingdialog: false,
                        method: _method === undefined ? 'POST' : _method,
                        success: function (res) {
                            compile_template(_placeholder, res, _post_callback, filter_data);
                        },
                        error: AjaxError
                    }
                    var ajx = new AjaxService();
                    var url = '';
                    var _evHandle = window.eventHandleIstance;
                    if (_evHandle.basedir != undefined) {
                        url = _evHandle.basedir + _data_source_;
                    } else {
                        url = _data_source_;
                    }
                    ajx.getJsonAsync(url, post_data, 'json', ajax_callback);
                }
            } else {
                if (debug) {
                    console.log("Undefined data source, cannot work in auto-mode");
                }
            }
        });
    }

    this.start = function () {
        var evIstance = window.eventHandleIstance;
        evIstance.template_attach($('[data-template]'));
        event_attach($('[data-event]'));

        // Attach event on DOM injection .
        $(document).arrive("[data-template]", evIstance.template_attach);
        $(document).arrive("[data-event]", {}, event_attach_arrive);
        if (debug) {
            console.log('Plugin EventHandle initialized');
        }
    }

    /**
     *
     *
     * @returns {undefined}
     */
    var replaceGeneralAjax = function () {
    }
    window.eventHandleIstance = this;
    if (autostart) {
        this.start();
    }
    replaceGeneralAjax();

}