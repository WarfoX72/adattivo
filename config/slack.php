<?php

/**
 * Clickup configuration files
 * 
 * For each API call can be specified method and url
 * If Api call needs params they can be specified as place holders
 * 
 */
return [
    "oauth_token" => "xoxb-2304095330483-2350708963841-VLki9yxD7cstF3arI8zBSv9v",
    "api_endpoint" => "https://slack.com/api/",
    "api_functions" => [
        "getChannels" => (object)
        [
            "url" => "conversations.list",
            "method" => "get"
        ],
        "createMessage" => (object) [
            "url" => "chat.postMessage",
            "method" => "post"
        ]
    ]
];
