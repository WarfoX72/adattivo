<?php

namespace App\Http\Helpers;

// For api calls
use App\Exceptions\AdattivoException;
use Illuminate\Support\Facades\Http;

/**
 *  Click up interface function
 * 
 *  Using personal api_key as i've not a public server for URI OAuth parameters
 * 
 *  
 *  @todo Pass to Oauth2 authentication method
 * 
 *  @author Alberto De Boni <a.deboni@neobe.it>
 *  @copyright (c) 2020 , Alberto De Boni
 *  @version 0.1
 * 
 */
class clickup {

    /**
     * CLICKUP Definitions
     */
    const AUTH_PERSONAL = 'personal';
    const AUTH_OAUTH = 'oauth';
    const DEFAULT_STATE = "TO DO";
    // Task priority definition: 1 is Urgent2 is High3 is Normal4 is Low
    const DEFAULT_PRI = 3;
    // Default due date delay starting from today in seconds
    const DEFAULT_TIMEDELAY = 30 * 24 * 60 * 60;
    // Default time estimation in seconds
    const DEFAULT_ESTIMATION = 5 * 24 * 60 * 60;

    private $personal_api_key = null;
    private $auth_method = null;
    private $api_endpoint = null;

    /**
     * 
     */
    public function __construct() {
        $auth_type = config('clickup.api_authentication_type');
        if ($auth_type != null) {
            if ($auth_type == self::AUTH_PERSONAL) {
                $this->personal_api_key = config('clickup.api_key');
                if ($this->personal_api_key !== null) {
                    // Get API parameters for authentication
                    $this->auth_method = self::AUTH_PERSONAL;
                    $this->getOtherConfig();
                } else {
                    //$this->getOtherConfig();
                    throw new AdattivoException("Missing clickup personal authentication api_key", -1027);
                }
            } else if ($auth_type == self::AUTH_OAUTH) {
                //@todo Add oauth
                throw new AdattivoException("Clickup Oauth2 authentication not supported yet", -1026);
            } else {
                throw new AdattivoException("Wrong clickup authentication type", -1025);
            }
        } else {
            throw new AdattivoException("Missing clickup authentication type", -1024);
        }
    }

    /**
     * Get Other config parameters
     * 
     */
    private function getOtherConfig() {
        $api_base_url = config('clickup.api_endpoint');
        if ($api_base_url !== null) {
            $this->api_endpoint = $api_base_url;
            // fix end poitn when missing / (do a fast trick)
            $this->api_endpoint = rtrim($this->api_endpoint, '/') . '/';
        } else {
            throw new AdattivoException("Missing clickup end point", -1028);
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
        if ($this->auth_method === self::AUTH_PERSONAL) {
            return array("Authorization" => $this->personal_api_key);
        } else if ($this->auth_method === self::AUTH_OAUTH) {
            // this should be a no execute Anyway an error message is returned
            throw new \Exception("Clickup Oauth2 authentication not supported yet", -1029);
        }
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
            $api_object = config('clickup.api_functions.' . $api_function);
            if ($api_object !== null) {
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
                                throw new AdattivoException("ClickUp API Call Failure!", -32767);
                            }
                            break;
                        case 'post':
                            $full_url = $this->api_endpoint . $api_object->url;
                            // Replace parameters
                            foreach ($params as $param_key => $param) {
                                $param_key = "{{" . $param_key . "}}";
                                $full_url = str_replace($param_key, $param, $full_url);
                            }
                            //Control if a defined encoding type is specified
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
                                    throw new AdattivoException("ClickUp API Call Failure! Method POST", -32767);
                                }
                            } else {
                                $result = Http::withHeaders($headers)->post($full_url, $post_data);
                                if (!$result->serverError()) {
                                    return $result->json();
                                } else {
                                    throw new AdattivoException("ClickUp API Call Failure!", -32767);
                                }
                            }
                            break;
                        case 'delete':
                        case 'put':
                            // @todo Other method call implementation
                            break;
                    }
                } else {
                    throw new AdattivoException("Clickup missing api url", -1030);
                }
            } else {
                throw new AdattivoException("Clickup missing api definition", -1031);
            }
        }
    }

    /**
     * Get Team
     * 
     * 
     */
    public function getTeam() {
        $teams_json = $this->callApi(__FUNCTION__, $this->setAuth());
        return $teams_json;
    }

    /**
     * 
     * 
     */
    public function getSpaces(int $teamid) {
        if (!empty($teamid)) {
            $teams_json = $this->callApi(__FUNCTION__, $this->setAuth(), ["teamid" => $teamid]);
            return $teams_json;
        } else {
            throw new AdattivoException(__FUNCTION__ . " call error", -1033);
        }
    }

    /**
     * 
     * 
     */
    public function getFolder(int $spaceid) {
        if (!empty($spaceid)) {
            $folder_list = $this->callApi(__FUNCTION__, $this->setAuth(), ["spaceid" => $spaceid]);
            return $folder_list;
        } else {
            throw new AdattivoException(__FUNCTION__ . " call error", -1033);
        }
    }

    /**
     * 
     */
    public function getList(int $folderid) {
        if (!empty($folderid)) {
            $folder_list = $this->callApi(__FUNCTION__, $this->setAuth(), ["folderid" => $folderid]);
            return $folder_list;
        } else {
            throw new AdattivoException(__FUNCTION__ . " call error", -1033);
        }
    }

    /**
     * 
     */
    public function getFolderLessList(int $spaceid) {
        if (!empty($spaceid)) {
            $folder_list = $this->callApi(__FUNCTION__, $this->setAuth(), ["spaceid" => $spaceid]);
            return $folder_list;
        } else {
            throw new AdattivoException(__FUNCTION__ . " call error", -1033);
        }
    }

    /**
     * 
     */
    public function createTask(int $list_id, $post_data) {
        if (!empty($list_id) && !empty($post_data)) {
            $result = $this->callApi(__FUNCTION__, $this->setAuth(), ["listid" => $list_id], $post_data);
            return $result;
        } else {
            throw new AdattivoException(__FUNCTION__ . " call error", -1033);
        }
    }

}
