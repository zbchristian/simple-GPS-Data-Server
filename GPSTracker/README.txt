Howto - GPS-Tracker
===================
Requirements: 
- PHP w/ SQLITE3 installed 
- GO compiler for TCP/UDP-HTTP bridge (only needed for commercial tracking devices like TK103 etc)

Installation:
- copy all files in gpstracker_webapp folder to web space folder (e.g. gpstracker)
- create corresponding entry in webserver config to allow web access and php to run
- adjust main .htaccess file (rewrite rules)
- access control for admin interface
	o create .htpasswd file in auth directory and/or adjust path in admin/.htaccess 
- edit scripts/config.php: adjust settings
- TCP/UDP-HTTP-Bridge 
	o enable/disable in scripts/config.php
	o compile code with GO in tcp_udp_http_bridge_go (go build)
	o copy executable to exe directory on webspace
	o adjust config.php accordingly (name and path of/to executable)
- database file will be created automatically
	
Enter tracking devices
- open page https://servername/gpstracker/admin and fill out the form

Tracking devices
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
	o In Einstellungen -> Leistung
		o Aufzeichnungsintervall wählen (z.B. 20 Sekunden)
		o GPS zwischen Fixes aktiviert lassen: sinnvoll bei kurzen Abständen. Kostet Akku
		o Distanz zwischen Punkten: nur neue Daten schicken, wenn z.B. mindestens 10m zurückgelegt worden sind
		o Aufzeichnung pausieren, wenn keine Bewegung: aktivieren
