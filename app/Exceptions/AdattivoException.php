<?php

namespace App\Exceptions;

use Exception;

class AdattivoException extends Exception {

    public function render($request, $e) {
        return response()->view(
                        'error',
                        array(
                            'exception' => $e
                        )
        );
    }

}
