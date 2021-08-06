<?php

namespace App\Http\Helpers;

// For api calls
use Illuminate\Support\Facades\Http;

/**
 *  Slack interface functions
 *  
 * 
 *  @author Alberto De Boni <a.deboni@neobe.it>
 *  @copyright (c) 2020 , Alberto De Boni
 *  @version 0.1
 * 
 */
class slack {

    const SLACK_AUTH = "Bearer";

    private $oauth_token = null;
    private $auth_method = null;
    private $api_endpoint = null;

    /**
     * 
     */
    public function __construct() {
        $this->oauth_token = config('slack.oauth_token');
        if ($this->oauth_token == null) {
            throw new \Exception('Missing Slack oath authentication api_key', -2048);
        }
        $this->getOtherConfig();
    }

    /**
     * Get Other config parameters
     * 
     */
    private function getOtherConfig() {
        $api_base_url = config('slack.api_endpoint');
        if ($api_base_url !== null) {
            $this->api_endpoint = $api_base_url;
            // fix end poitn when missing / (do a fast trick)
            $this->api_endpoint = rtrim($this->api_endpoint, '/') . '/';
        } else {
            throw new \Exception("Missing clickup end point", -1028);
        }
    }

    /**
     * Set Headers
     * 
     * Set api call headers according to authentication method
     * 
     * @todo Oauth2 headers
     */
    private function setAuth() {
        return array("Authorization" => self::SLACK_AUTH . " " . $this->oauth_token);
    }

    /**
     * 
     * @param type $api_url
     * @param type $headers
     * @param array $params Optional parameters to be passed. Params must be of type key=>value to correct placement
     * @return type
     */
    private function callApi($api_function, $headers, array $params = [], array $post_data = []) {
        if ($headers !== null) {
            $api_object = config('slack.api_functions.' . $api_function);
            if ($api_object !== null && is_object($api_object)) {
                // No default method assume GET
                if (!isset($api_object->method)) {
                    $api_object->method = 'get';
                }
                // Do api call
                if (isset($api_object->url)) {
                    switch ($api_object->method) {
                        case 'get':
                            $full_url = $this->api_endpoint . $api_object->url;
                            // Replace parameters
                            foreach ($params as $param_key => $param) {
                                $param_key = "{{" . $param_key . "}}";
                                $full_url = str_replace($param_key, $param, $full_url);
                            }
                            $result = Http::withHeaders($headers)->get($full_url);
                            if (!$result->serverError()) {
                                return $result->json();
                            } else {
                                throw new AdattivoException("Slack communication error", -16640);
                            }
                            break;
                        case 'post':
                            $full_url = $this->api_endpoint . $api_object->url;
                            // Replace parameters
                            foreach ($params as $param_key => $param) {
                                $param_key = "{{" . $param_key . "}}";
                                $full_url = str_replace($param_key, $param, $full_url);
                            }
                            if (isset($api_object->type)) {
                                switch ($api_object->type) {
                                    case "json":
                                        $result = Http::withHeaders($headers)->acceptJson()->post($full_url, $post_data);
                                        break;
                                    default:
                                        $result = Http::withHeaders($headers)->post($full_url, $post_data);
                                        break;
                                }
                                if (!$result->serverError()) {
                                    return $result->json();
                                } else {
                                    throw new AdattivoException("Slack communication error", -16640);
                                }
                            } else {
                                $result = Http::withHeaders($headers)->post($full_url, $post_data);
                                if (!$result->serverError()) {
                                    return $result->json();
                                } else {
                                    throw new AdattivoException("Slack communication error", -16640);
                                }
                            }
                            break;
                        case 'delete':
                        case 'put':
                            // @todo Other method call implementation
                            break;
                    }
                } else {
                    throw new AdattivoException("Slack Missing or wrong config", -16644);
                }
            } else {
                throw new AdattivoException("Slack Missing or wrong config", -16643);
            }
        }
    }

    /**
     * Get Channels
     * 
     * Get Slack channel list
     * 
     */
    public function getChannels() {
        $result = $this->callApi(__FUNCTION__, $this->setAuth(), ['excluded_archived' => false]);
        return $result;
    }

    /**
     * Send Message
     * 
     * Send a Message to a slack channel
     * 
     */
    public function createMessage($channel, $message_data) {
        if (!empty($channel) && !empty($message_data)) {
            $result = $this->callApi(__FUNCTION__, $this->setAuth(), [], ["channel" => $channel, "text" => $message_data]);
            return $result;
        } else {
            throw new AdattivoException(__FUNCTION__ . " call error", -16655);
        }
    }

}
