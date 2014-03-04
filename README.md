vozenraya
=========

Tres En Raya controlable por voz mediante navegador. Apto para personas con discapacidad visual.

Programado puramente en Javascript. Como motor de reconocimiento uso el propio de Google. Desde Chrome puede ser tan fácil como generar un objeto webkitSpeechRecognition. Con cierta orden, el navegador captura el micrófono hasta que detecta una pausa o llega a un límite de tiempo, comprime este fragmento de audio en FLAC, lo envía a los servidores de Google, ahí se convierte a texto y en el navegador se recibe como otro objeto Javascript. Y así hasta que otros navegadores incluyan sus propios mecanismos.
Información semi-oficial: http://updates.html5rocks.com/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API

Otro de mis objetivos era que no dependiera de ningún plugin externo. (Tal vez con alguno me hubiera sido mucho más fácil, pero estándares al poder)
Se pueden bajar estas páginas y el contenido tal cual para cualquier servidor web.

ESTADO ACTUAL:
Diría que ya está listo en castellano, y el sistema está preparado para aceptar otros idiomas (tomado del navegador), o cambiar al predeterminado. El resto de traducciones puede correr a cargo de cualquier voluntario.
Probablemente aún quede algún bug pero, sinceramente, me muero de ganas por empezar mi siguiente aplicación. Pronto lo dejaré todo en manos de la comunidad.

CRÉDITOS:
Desarrollo principal: Titanio Verde
Traducciones: 
Locuciones: María G. Lahoz (es)
