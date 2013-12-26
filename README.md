vozenraya
=========

Tres En Raya controlable por voz mediante navegador.

Se pueden leer las instrucciones en la propia página.

Programado puramente en Javascript. Como motor de reconocimiento uso el propio de Google. Desde Chrome puede ser tan fácil como generar un objeto webkitSpeechRecognition. Con cierta orden, el navegador captura el micrófono hasta que detecta una pausa o llega a un límite de tiempo, comprime este fragmento de audio en FLAC, lo envía a los servidores de Google, ahí se convierte a texto y en el navegador se recibe como otro objeto Javascript.
Información semi-oficial: http://updates.html5rocks.com/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API

Quiero que dependa lo menos posible de software adicional, por lo cual descarto el uso de Java, Flash, etc. Para variar, el único navegador que incluye tal funcionalidad de serie, cumpliendo la respectiva especificación HTML5, es Chrome / Chromium para escritorio. Opera incluye algo similar, pero se basa en los motores del sistema operativo, de modo que no es multiplataforma. Android incluye API para el reconocimiento de voz de Google, pero ninguno de sus navegadores lo aprovecha.


ESTADO ACTUAL:
Cerca de poder jugar nada más abrir la página y sin pulsar nada. Programar cada ciclo de reconocimiento de voz se me hace un poco complicado, gracias a la naturaleza asíncrona de Javascript.
