<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdattivoController;
use App\Http\Controllers\MyErrorController;

/*
  |--------------------------------------------------------------------------
  | Web Routes
  |--------------------------------------------------------------------------
  |
  | Here is where you can register web routes for your application. These
  | routes are loaded by the RouteServiceProvider within a group which
  | contains the "web" middleware group. Now create something great!
  |
 */

Route::get('/', function () {
    return redirect()->route('adattivo.index');
});

Route::resource('adattivo', 'App\Http\Controllers\AdattivoController');
// <editor-fold defaultstate="collapsed" desc="Clickup Ajax Routing calls">
// Load spaces for workspace/team
Route::get('adattivo/spaces/{teamid}', [AdattivoController::class, 'loadSpaces']);
// Load folder for space
Route::get('adattivo/folder/{spaceid}', [AdattivoController::class, 'loadFolder']);
// Load lists for space
Route::get('adattivo/list/{spaceid}', [AdattivoController::class, 'loadList']);
// </editor-fold>
