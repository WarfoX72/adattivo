<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Adattivo Example</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">
        <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    </head>
    <body>
        <div class="container">
            @yield('content')
        </div>
        <script src="https://code.jquery.com/jquery-3.4.1.min.js" type="application/javascript"></script>
        <script type="text/javascript" src="{{ asset('js/sweetalert.js') }}"></script>
        <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js" type="application/javascript"></scritp>
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" type="application/javascript"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert/2.1.2/sweetalert.min.js" type="application/javascript"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment-with-locales.min.js" type="application/javascript"></script>
        <script type="text/javascript" src="{{ asset('js/i18next.js') }}"></script>
        <script type="text/javascript" src="{{ asset('js/arrive.js') }}"></script>
        <script type="text/javascript" src="{{ asset('js/evHandle.js') }}"></script>
        <script type="text/javascript" src="{{ asset('js/adattivo/adattivo.js') }}"></script>
    </body>
</html>