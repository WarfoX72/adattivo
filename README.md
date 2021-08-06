## Adattivo Test

Applicazione di test per la creazione di un Task in Clickup e invio di una notifica in un canale Slack

L'applicazione richiede la configurazione delle credenziali di Clickup e Slack.

**Configurazione clickup

Il file di configurazione è: /config/clickup.php

La chiave da modificare è api_key con il proprio codice personale ottenuto dal sito web di clickup.
<a href="https://clickup20.docs.apiary.io/#reference/0/authorization/get-access-token">Clickup get access token</a>

L'unica modalità di autenticazione attualmente implementata è "personal", quindi la chiave api_authentication_type non deve essere modifcata.

    "api_authentication_type" => 'personal',
    "api_key" => "pk_10952744_AIL47YX36VX7KY95NY9SDABB6P8YYFJ8",

**Configurazione slack 

Clickup si basa sulle APP di slack per la creazione di una app seguire le istruzioni presenti a link <a href="https://api.slack.com/authentication/basics">App creation</a>. 
La app puo essere create tramite il link <a href="https://api.slack.com/apps">Slack APP</a>
Una volta creata la APP è necessario recuperare il token di accesso da inserire nel file di configurazione di slack.
Il token è recuperabile nel menù OAuth & Permissions, nello specifico è necessario utilizzare il "Bot User OAuth Token".

Nella stessa pagina è necessario aggiungere i permessi corretti nel "Bot Token Scopes", i permessi necessari sono:

-channels:read
-chat:write
-groups:read
-im:read
-incoming-webhook
-mpim:read

Il file di configurazione è: /config/slack.php

   "oauth_token" => "xoxb-2304095330483-2350708963841-YtW138TiR3fApaZ1ArMWzOn5",

Il bot inizialmente puo aggiungere messaggi solo nel canale in cui viene installato. Per poter inviare i messaggi in altri canali deve essere esplicitamente invitato come partecipante al canale. 

## Architettura

L'archiettura dell'applicazione è abbastanza semplice:

Il controller Adattivo contiene tutta la logica necessaria per la generazione dell'interfaccia e tutti i metodi utilizzati per le chiamate Ajax: le combo box dipendenti da una scelta precedente sono caricate tramite una chiama Ajax. Le liste sono figlie degli spaces ed essi sono figli dei workspaces. Alla variazione di uno dei combo box padre i combo box figli vengono ricaricati con i dati corretti.


