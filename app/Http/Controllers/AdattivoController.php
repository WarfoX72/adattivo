<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Helpers\clickup;
use App\Http\Helpers\slack;
use App\Exceptions\AdattivoException;

class AdattivoController extends Controller {

    const SLACK_MESSAGE = "Dear All a task named \"{{task_title}}\" has been created\n"
            . "More details:\n"
            . "{{task_description}}\n\n"
            . "Task url is:\n" .
            "{{task_url}}";

    // <editor-fold defaultstate="collapsed" desc="Main page">

    /*     * "
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index() {
        // Load Workspaces from Clickup
        $clickup_controller = new clickup();
        $team_object = $clickup_controller->getTeam();
        if (isset($team_object['err']) && !empty($team_object['err'])) {
            throw new AdattivoException("Error in communication with Clickup with message : " . $team_object['err']);
        }
        // Remove myself from team list

        $slack_controller = new slack();
        $slack_channel_list = $slack_controller->getChannels();
        if (isset($slack_channel_list['ok']) && $slack_channel_list['ok'] == false) {
            throw new AdattivoException("Error in communication with slack with message : " . $slack_channel_list['error']);
        }

        return view('index', array("workspaces" => $team_object, "channels" => $slack_channel_list));
    }

    /**
     * Load Spaces
     * 
     * Load Spaces defined in Workspace
     * 
     */
    public function loadSpaces(Request $request, int $teamid) {
        $clickup_controller = new clickup();
        $space_object = $clickup_controller->getSpaces($teamid);
        // Filter only usefull information
        $answer = array();
        if (isset($space_object['spaces'])) {
            foreach ($space_object['spaces'] as $space) {
                $answer[] = [
                    "id" => $space['id'],
                    "name" => $space['name']
                ];
            }
        }
        return response()->json($answer);
    }

    /**
     * Load List
     * 
     * Function to load Lists from ClicUP
     * As lists can be folderless or folded then mix them 
     * with evidence of which are  folderless or folded
     * 
     * 
     */
    public function loadList(Request $request, int $spaceid) {
        $clickup_controller = new clickup();
        // First take folderless
        $folderless_list_object = $clickup_controller->getFolderLessList($spaceid);
        if (!isset($folderless_list_object['err'])) {

            $answer = array();
            if (count($folderless_list_object['lists']) > 0) {
                foreach ($folderless_list_object['lists'] as $list) {
                    $answer[] = [
                        "id" => $list['id'],
                        "name" => $list['name']
                    ];
                }
            }
            // Get folded lists
            $folder_object = $clickup_controller->getFolder($spaceid);

            if (!isset($folderless_list_object['err'])) {
                if (count($folder_object['folders']) > 0) {
                    foreach ($folder_object['folders'] as $folder) {

                        // Get list
                        $folderid = $folder['id'];
                        $folder_name = $folder['name'];
                        $folded_list = $clickup_controller->getList($folderid);
                        if (count($folded_list['lists']) > 0) {
                            foreach ($folded_list['lists'] as $list) {
                                $answer[] = [
                                    "id" => $list['id'],
                                    "name" => $folder_name . "/" . $list['name']
                                ];
                            }
                        }
                    }
                }
                $columns = array_column($answer, 'name');
                array_multisort($columns, SORT_ASC, $answer);
            } else {
                $answer['error'] = 1;
            }
        } else {
            $answer['error'] = 1;
        }
        return response()->json($answer);
    }

    /**
     * 
     */
    public function loadFolder(Request $request, int $spaceid) {
        $clickup_controller = new clickup();
        $folder_object = $clickup_controller->getFolder($spaceid);
        if (!isset($folder_object['err'])) {
            // Filter only usefull information
            $answer = array();
            if (isset($space_object['folder'])) {
                foreach ($folder_object['folder'] as $space) {
                    $answer[] = [
                        "id" => $space['id'],
                        "name" => $space['name']
                    ];
                }
            }
        } else {
            $answer['error'] = 1;
        }
        return response()->json($answer);
    }

// </editor-fold>    

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create() {
        
    }

    /**
     * Store a newly created resource in clickup and slack.
     * 
     * Clickup time is in milliseconds
     * 
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request) {
        // Csrf is checked by laravel
        // Other consistency is checked by clickup
        $clickup_controller = new clickup();
        // Prepare new task data structure
        $list_id = $request->input('list');
        $new_task_data = array(
            "name" => $request->input('tasktitle'),
            "description" => $request->input('taskdescr'),
            "watchers" => array_values($request->input('watchers')),
            "assignees" => array_values($request->input('users')),
            "tags" => array(),
            "status" => $clickup_controller::DEFAULT_STATE,
            "priority" => $clickup_controller::DEFAULT_PRI,
            "parent" => null,
            "links_to" => null,
            "custom_fields" => array(),
            "notify_all" => true,
            "due_date" => (time() + $clickup_controller::DEFAULT_TIMEDELAY) * 1000,
            "due_date_time" => false,
            "time_estimate" => ($clickup_controller::DEFAULT_ESTIMATION) * 1000,
            "start_date" => time() * 1000,
            "start_date_time" => false,
        );
        //Fix data Types
        $new_task_data = (array) json_decode(json_encode($new_task_data, JSON_NUMERIC_CHECK));
        $clickup_task = $clickup_controller->createTask($list_id, $new_task_data);
        if (!isset($clickup_task['err'])) {

            $url = $clickup_task['url'];
            $value_list = [
                "{{task_title}}" => $request->input('tasktitle'),
                "{{task_description}}" => $request->input('taskdescr'),
                "{{task_url}}" => $url];

            $find = array_keys($value_list);
            $replace = array_values($value_list);
            $message = str_ireplace($find, $replace, self::SLACK_MESSAGE);

            $slack_controller = new slack();
            $slack_response = $slack_controller->createMessage($request->input('channel'), $message);
            if ($slack_response['ok'] !== false) {
                $answer = [
                    "ok" => 1
                ];
            } else {
                if (isset($slack_response['error']) && !empty($slack_response['error'])) {
                    $answer = [
                        "error" => 1,
                        "message" => $slack_response['error']
                    ];
                }
            }
        } else {
            $answer = [
                "error" => 1,
                "message" => $clickup_task['err']
            ];
        }
        return response()->json($answer);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id) {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id) {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id) {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id) {
        //
    }

}
