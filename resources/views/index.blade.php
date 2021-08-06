@extends('master')

@if(session()->has('error'))
<div class="alert alert-danger">
    {{ session()->get('error') }}
</div>
@else
@section('content')
<style>
    .push-top {
        margin-top: 50px;
    }
    .error{
        color: #AA0000;
    }
</style>
<div class="container">
    <div class="row">
        <div class="col-lg-2"></div>
        <div class="col-lg-8">
            <div class="card push-top ">
                <div class="card-header">
                    Create Task
                </div>
                <div class="card-body">
                    @if ($errors->any())
                    <div class="alert alert-danger">
                        <ul>
                            @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div><br />
                    @endif
                    <form id="createTask" name="createTask" method="post" action="{{ route('adattivo.store') }}">
                        <div class="form-group">
                            @csrf
                            <label for="workspace">Workspace</label>
                            <select id="workspace" class="form-control" name="workspace" data-event='evHandle,change' data-event-function='adattivo.reloadSpaces,adattivo.reloadSpaces'>
                                @foreach ($workspaces['teams'] as $workspace)
                                <option value="{{ $workspace['id'] }}"">{{ $workspace['name'] }}</option>
                                @endforeach 
                            </select>

                        </div>
                        <div class="form-group">
                            <label for="spaces">Spaces</label>
                            <select id="spaces" class="form-control" name="spaces" data-event='change' data-event-function='adattivo.reloadList'>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="list">List</label>
                            <select id="list" class="form-control" name="list" data-event='change' data-event-function='adattivo.'>
                            </select>

                        </div>
                        <div class="form-group">
                            <label for="watchers[]">Watchers</label>
                            <select id="watchers[]" class="form-control" name="watchers[]" data-event='change' data-event-function='' multiple required="">
                                @include('include.users')
                            </select>

                        </div>

                        <div class="form-group">
                            <label for="users[]">Users</label>
                            <select id="users[]" class="form-control" name="users[]" data-event='change' data-event-function='' multiple  required="">
                                @include('include.users')
                            </select>
                        </div>
                        <!-- slack channels -->
                        <div class="form-group">
                            <label for="channel">Slack Channels</label>
                            <select id="channel" class="form-control" name="channel" required="">
                                @foreach ($channels['channels'] as $channel)
                                <option value="{{ $channel['id'] }}"">#{{ $channel['name'] }}</option>
                                @endforeach 
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="tasktitle"></label>
                            <input class="form-control" name="tasktitle" id="tasktitle" type="text" placeholder="Enter Task Title" required="required">
                        </div>
                        <div class="form-group">
                            <label for="taskdescr"></label>
                            <textarea class="form-control" name="taskdescr" id="taskdescr" type="text" placeholder="Enter Task Description" required="required"></textarea>
                        </div>

                        <button type="button" class="btn btn-block btn-danger" data-event="click" data-event-function="adattivo.saveTask">Create Task</button>
                    </form>
                </div>
            </div>
        </div>
        <div class="col-lg-2"></div> 
    </div>
</div>
@endsection
@endif`