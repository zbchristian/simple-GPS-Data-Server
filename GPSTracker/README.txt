Howto - GPS-Tracker
===================
Requirements
------------
- PHP w/ SQLITE3 API installed 
- GO compiler for TCP/UDP-HTTP bridge (only needed for commercial tracking devices like TK103 or GPS Logger in UDP mode)
- java script GPXVierwer by Jürgen Berkemeier (included in folder js/GM_utils/)

Installation
------------
- copy all files in webapp folder to web space folder (for example gpstracker)
- create corresponding entry in webserver config to allow web access and php to run
- adjust main .htaccess file (rewrite rules)
- access control for admin interface
	o create .htpasswd file in auth directory and/or adjust path in admin/.htaccess 
- edit scripts/config.php: adjust settings
- TCP/UDP-HTTP-Bridge 
	o enable/disable in scripts/config.php
	o compile code with GO in tcp_udp_http_bridge (go build)
	o copy executable to exe directory on webspace
	o adjust config.php accordingly (name and path of/to executable)
	o call admin interface to start server
	o add crontab entry to check once per hour, if the server is running (requires "wget")
		1 * * * * /usr/bin/wget -O /dev/null -o /dev/null https://<WEBSERVER>/<PATH>?checkserver=<SECRETKEY> >/dev/null 2>&1
	 	 
- database file will be created automatically
	
Enter tracking devices
----------------------
- open page https://servername/gpstracker/admin and fill out the form

View data
---------
- open page https://servername/gpstracker?id=<ID of device>
	o optional parameter to select the time span: dt=<time span> in min(m), hours(h), days(d) or years(y), e.g. "10d" for 10 days 

Tracking devices
----------------
- GPS Logger for Android
	o Öffne Einstellungen -> Logging Details
		o "Logge zu GPX Datei": kann sinnvoll sein, falls keine Datenverbindung existiert und nur der Route aufgezeichnet werden soll
		o "Logge zu einem OpenGTS-Server" für Echtzeit-Tracking aktivieren
			server: "<servername.com>"
			Port: 443
			Kommunikationsmethode: HTTPS
			Serverpfad: /gpstracker
			Geräte-ID: die beim Anlegen des Geräts definiere Kennung (ID)
			Testen ob Kommunikations funktioniert: SSL Zertifikat überprüfen antippen
	o Kommunikationsmethode UDP: port number as given in config.php (default 20202) -> requires the server to run  
	o In Einstellungen -> Leistung
		o Aufzeichnungsintervall wählen (z.B. 20 Sekunden)
		o GPS zwischen Fixes aktiviert lassen: sinnvoll bei kurzen Abständen. Kostet Akku
		o Distanz zwischen Punkten: nur neue Daten schicken, wenn z.B. mindestens 10m zurückgelegt worden sind
		o Aufzeichnung pausieren, wenn keine Bewegung: aktivieren
- commercial devices
	o set TCP/IP server and port in config.php 
	o server has to be compiled and placed in exe directory
	o server is automatically started, when the admin interface is opened
		- copy devices.config to exe directory
	o supported devices: TK103B
		- device configurations in devices.config

Configuration of the map
------------------------
- the map and tracks are included by the java script GPX Viewer by Jürgen Berkemeier (https://www.j-berkemeier.de/GPXViewer/)
- the look and behavior can be controlled by adding optional parameters (listed on the above web page) into the html template in html/gpxviewer_html.template
- the default map is selected in config.php (OpenStreet-Map (OSM,OSMDE) , Google-Map (Karte)) 
- in order to use google maps, an API key is required. The key has to be entered into the script js/GM_utils/GPX2GM_Defs.js
 
