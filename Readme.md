Simple GPS Data Server
=====================

Collect the GPS position from devices (smart phone, GPS tracker), store in a SQLite database and allow to display on a map (OSM or Google).
- Data are received from the device either via HTTPS (PHP) or a tcp/udp packet (GO server)
- Stored tracks can be downloaded as a GPX file
- Simple admin interface to add and edit new devices

Requirements
------------
- Webserver (Apache or similar), which supports authentification (for the admin page)
- PHP w/ SQLITE3 API installed 
- GO compiler for TCP/UDP-HTTP bridge (only needed for commercial tracking devices like TK103 or GPS Logger in UDP mode)
  o extra package golang.org/x/crypto is required. Install with "go get golang.org/x/crypto"
- java script GPXViewer by Jürgen Berkemeier (folder js/GM_utils/)

Installation
------------
- Copy all files in the webapp folder to the web space folder (in the following gpstracker/ is assumed)
- Create corresponding entry in webserver config to allow web access and php to run
- Cdjust the top level .htaccess file
 ```
 RewriteBase gpstracker
 ```
- Cet the authentification for the admin interface
 ```
 create .htpasswd file in the auth directory and/or adjust path in admin/.htaccess 
 ```
- Edit scripts/config.php: adjust settings
 ```
 Define timezone, which map to use, date/time format
 Specify the time span w/o movement to be recognized as a pause
 Specify the time w/o movement to start a new track
 Enable or disable the start of the tcp/udp bridge GO server 
 ```
- Get the javascript GPXViewer from https://www.j-berkemeier.de/GPXViewer/ and copy the folder GM_Utils to gpstracker/js/
 ```
In order to use Google maps, an API key is required
Edit the file ./js/GM_Utils/GPX2GM_Defs.js and uncomment the line containing  JB.GPX2GM.GM_Api_key and add the API key as the value
 ```
- TCP/UDP-HTTP-Bridge 
 ```
enable/disable in scripts/config.php
compile code with GO in tcp_udp_http_bridge (go build)
copy executable to exe directory on webspace
adjust config.php accordingly (name and path of/to executable)
call admin interface to start server
add a crontab entry to check once per hour, if the server is running (requires "wget")
   1 * * * * /usr/bin/wget -O /dev/null -o /dev/null https://<WEBSERVER>/<PATH>?checkserver=<SECRETKEY> >/dev/null 2>&1
 ```
	 	 
- The database file will be created automatically
	
Enter tracking devices
----------------------
- open page https://servername/gpstracker/admin and fill out the form

View data
---------
- open page https://servername/gpstracker?id=<ID of device>
  optional parameter to select the time span: dt=<time span> in min(m), hours(h), days(d) or years(y), e.g. "10d" for 10 days 

Tracking devices
----------------
- GPS Logger for Android
 ```
 Open settings -> Logging Details -> "Log to OpenGTS server" in order to activate the real time tracking
			server: "<servername.com>"
			port: 443
			communication method: HTTPS
			server path: /gpstracker
			device ID: the ID you entered in the admin interface
			test the comunication by clicking "check SSL certificate"
 ```
 ```
 Alternative communication method UDP: use the port number given in config.php (default 20202) -> requires the server to run
    If the cost of mobile data transmission is an issue, this is the correct choice, since the amount of data is minimal
 ```
 ```
Settings->performance
  select interval  (e.g. 20 sec)
  keep the GPS activated between fixes: makes sense for a short interval, but needs more battery 
  set distance bewteen data points: send no data, when distance is below a certain limit (e.g. 10m)
  activate "stop recording, if no movement is detected"
 ```
- Commercial devices usually send the GPS position via tcp/udp. This requires the server to run
 ```
set TCP/IP server and port in config.php 
configure the server and port in the tracking device (usually done via SMS. Check the manual how to do this)
server has to be compiled and placed in ./exe/ directory
copy devices.config to the ./exe/ directory. This contains regular expressions for different formats (e.g. OpenGTS, TK103)
server is automatically started, when the admin interface is opened. 
  This requires, that PHP is allowed to start the server via an "exec()" call. 
  If this is not possible, the server has to be started manually or via a cron job (see below)
 ```

Configuration of the map
------------------------
- the map and tracks are included by the java script GPX Viewer by Jürgen Berkemeier (https://www.j-berkemeier.de/GPXViewer/)
- the look and behavior can be controlled by adding optional parameters (listed on the above web page) into the html template in html/gpxviewer_html.template
- the default map is selected in config.php (OpenStreet-Map (OSM,OSMDE) , Google-Map (Karte)) 
- in order to use google maps, an API key is required. The key has to be entered into the script js/GM_utils/GPX2GM_Defs.js
 
TCP/UDP-Server
--------------
The GO code opens a port and accepts connections via TCP and UDP. The server just digests the paket and does not respond. The received data are matched to regular expressions of known device formats (./exe/devices.config). If a match if found and the device ID is known, the GPS location is passed to the PHP code via an HTTP connection to localhost. This stores the GPS location in the database. 
Parameters to pass to the server:
```
 -port <portnumber>
 -httpserver <server name>
 -urlpath <url to send data to>
 -key <secret key in order to check the status of the server - used by PHP>
```
