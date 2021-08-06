function adattivo() {
    "use strict";
    if (!(this instanceof adattivo)) {
        throw new Error("adattivo needs to be called with the new keyword");
    }

    var reloadCombo = function (url, item, callback = null) {
        eventHandleIstance.getAjaxService().getJsonAsync(url, undefined, 'json', {
            success: function (resource) {
                // fill combo
                item.html('');
                $.each(resource, function (key, space) {
                    var option_item = "<option value=\"" + space.id + "\">" + space.name + "</option>";
                    item.append(option_item);
                });
                if (callback != null) {
                    callback();
                }
            },
            method: 'get',
            showloadingdialog: 1
        });

    }
    /**
     * 
     * @param {type} e
     * @returns {undefined}
     */
    this.reloadList = function (e) {
        var team_id = $('#spaces').val();
        var url = "adattivo/list/" + team_id;
        reloadCombo(url, $('#list'));
    }

    /**
     * 
     * @param {type} e
     * @returns {undefined}
     */
    this.reloadFolders = function (e) {
        var team_id = $('#spaces').val();
        var url = "adattivo/folder/" + team_id;
        reloadCombo(url, $('#folder'));
    }


    /**
     * Function to dinamically reload Spaces based on Workspace
     * 
     * @param {type} e
     * @returns {undefined}
     */
    this.reloadSpaces = function (e) {
        var adattivo_class = eventHandleIstance.getObject('adattivo', 'default');
        var team_id = $('#workspace').val();
        var url = "adattivo/spaces/" + team_id;
        reloadCombo(url, $('#spaces'), adattivo_class.reloadList);
    }
    /**
     * Function to store a new Task
     */
    this.saveTask = function (e) {
        if ($('#createTask').valid()) {
            var form_data = $('#createTask').serializeArray();
            var url = "adattivo";
            eventHandleIstance.getAjaxService().getJsonAsync(url, form_data, 'json', {
                showloadingdialog: 1,
                success: function (resource) {
                    if (resource.ok != undefined && resource.ok == 1) {
                        swal({
                            title: "Good job!",
                            text: "Your task has been created succesfully!",
                            icon: "success",
                            button: "OK!",
                        });
                    }
                    if (resource.error != undefined && resource.error == 1) {
                        swal({
                            title: "Ooops!",
                            text: "I'm so sorry, a problem occourred while creating the task.",
                            icon: "error",
                            button: "OK!",
                        });

                    }
                },
            });

        }
    }

}


$(document).ready(function () {
    var option_translation = {
        resGetPath: 'locales/__lng__/__ns__.json',
        useCookie: false,
        nsseparator: false,
        keyseparator: false,
        fallbackLng: false,
        fallbackOnNull: false,
        fallbackOnEmpty: false
                //lng: 'en-US'
    };
    i18n.init(
            option_translation,
            function (err, t) {
                $(document).trigger('i18nloaded');
            });
    moment.locale(i18n.lng());
});

$(document).on('i18nloaded', function () {
    var eventsHandl = new eventHandle();
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            $(event.target).trigger('focusout');
            event.preventDefault();
            return false;
        }
    });
}
);
