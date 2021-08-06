@extends('master')

<div class="alert alert-danger">
    <h2>Error Found</h2>
    {{ $exception->getMessage() }}
    <p>Fix configuration error and reload</p>
</div>