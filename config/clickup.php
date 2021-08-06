<?php

/**
 * Clickup configuration files
 * 
 * For each API call can be specified method and url
 * If Api call needs params they can be specified as place holders
 * 
 */
return [
    "api_authentication_type" => 'personal',
    "api_key" => "pk_10952744_AIL47YX36VX7KY95NY9SDABB6P8YYFJ8",
    "oauth_id" => null,
    "oauth_secret" => null,
    "api_endpoint" => "https://api.clickup.com/api/",
    "api_functions" => [
        "getTeam" => (object)
        ["url" => "v2/team",
            "method" => "get"],
        "getSpaces" => (object)
        [
            "url" => "v2/team/{{teamid}}/space",
            "method" => "get"
        ],
        "getFolder" => (object)
        [
            "url" => "v2/space/{{spaceid}}/folder",
            "method" => "get"
        ],
        "getFolderLessList" => (object)
        [
            "url" => "v2/space/{{spaceid}}/list",
            "method" => "get"
        ],
        "getList" => (object)
        [
            "url" => "v2/folder/{{folderid}}/list",
            "method" => "get"
        ],
        "createTask" => (object)
        [
            "url" => "v2/list/{{listid}}/task",
            "method" => "post",
            "type" => "json"
        ]
    ]
];
