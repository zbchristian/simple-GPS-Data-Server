Simple GPS Data Server
======================

Collect the GPS position from devices (smart phone, GPS tracker), store in a SQLite database and allow to display on a map (OSM or Google).
- Data are received from the device either via HTTPS (PHP) or a tcp/udp packet (GO server)
- Stored tracks can be downloaded as a GPX file
- Simple admin interface to add and edit new devices

Requirements
------------
- Webserver (Apache or similar), which supports authentification (for the admin page)
- PHP with SQLITE3 API installed 
- GO compiler for TCP/UDP-HTTP bridge (only needed for commercial tracking devices like TK103 or GPS Logger in UDP mode).
  Extra package golang.org/x/crypto is required. Install with "go get golang.org/x/crypto"
- java script GPXViewer by Jürgen Berkemeier (folder js/GM_utils/)

Installation
------------
* Copy all files in the webapp folder to the web space folder (in the following ./gpstracker/ is assumed)
* Create corresponding entry in webserver config to allow web access and php to run
* Adjust the top level .htaccess file
 ```
 RewriteBase gpstracker
 ```
* Set the authentification for the admin interface
  * In the file <code>auth/.htpasswd</code> a single user <code>admin</code> with the password <code>changeme</code> is included
  * The path to the .htpasswd file has to be adjusted in <code>admin/.htaccess</code>. The absolute path is required!
  * Update .htpasswd with new users/passwords. Best use the command line<br> <code>htpasswd /path-to-htpasswd-file/.htpasswd myusername mypassword</code> or an online generator  
* Edit scripts/config.php: adjust settings
  * Define timezone, which map to use, date/time format
  * Specify the time span w/o movement to be recognized as a pause
  * Specify the time w/o movement to start a new track
  * Enable or disable the start of the tcp/udp bridge GO server 
* Get the javascript GPXViewer from <code>https://www.j-berkemeier.de/GPXViewer/</code> and copy the folder GM_Utils to <code>gpstracker/js/</code>
  * In order to use Google maps, an API key is required search for <code>google maps api key application</code>)
  * Edit the file <code>./js/GM_Utils/GPX2GM_Defs.js</code> and uncomment the line containing  <code>JB.GPX2GM.GM_Api_key</code> and add the API key as the value
* TCP/UDP-HTTP-Bridge 
  * enable/disable in scripts/config.php
  * compile code with GO in tcp_udp_http_bridge (go build)
  * copy executable to exe directory on webspace
  * adjust config.php accordingly (name and path of/to executable)
  * call admin interface to start server
  * add a crontab entry to check once per hour, if the server is running (requires "wget")<br>
   <code>1 * * * * /usr/bin/wget -O /dev/null -o /dev/null https://WEBSERVER/gpstracker?checkserver=SECRETKEY >/dev/null 2>&1</code>	 	 
* The database file will be created automatically
	
Enter tracking devices
----------------------
- open page https://servername/gpstracker/admin and fill out the form

View data
---------
- open page https://servername/gpstracker?id=<ID of device>
  optional parameter to select the time span: dt=<time span> in min(m), hours(h), days(d) or years(y), e.g. "10d" for 10 days 

Tracking devices
----------------
* GPS Logger for Android
  * Open settings -> Logging Details -> "Log to OpenGTS server" in order to activate the real time tracking
	 * server: "<servername.com>"
	 * port: 443
	 * communication method: HTTPS
	 * server path: /gpstracker
	 * device ID: the ID you entered in the admin interface
	 * test the comunication by clicking "check SSL certificate"
  * Alternative communication method UDP: use the port number given in config.php (default 20202) -> requires the server to run
  * If the cost of mobile data transmission is an issue, this is the correct choice, since the amount of data is minimal
  * Settings->performance
     * select interval  (e.g. 20 sec)
     * keep the GPS activated between fixes: makes sense for a short interval, but needs more battery 
     * set distance bewteen data points: send no data, when distance is below a certain limit (e.g. 10m)
     * activate "stop recording, if no movement is detected"
* Commercial devices usually send the GPS position via tcp/udp. This requires the server to run
  * set TCP/IP server and port in config.php 
  * configure the server and port in the tracking device (usually done via SMS. Check the manual how to do this)
  * server has to be compiled and placed in ./exe/ directory
  * copy <code>devices.config</code> to the ./exe/ directory. This contains regular expressions for different formats (e.g. OpenGTS, TK103)
  * server is automatically started, when the admin interface is opened. 
    * This requires, that PHP is allowed to start the server via an "exec()" call. 
    * If this is not possible, the server has to be started manually or via a cron job (see above)

Configuration of the map
------------------------
- the map and tracks are included by the java script GPX Viewer by Jürgen Berkemeier (https://www.j-berkemeier.de/GPXViewer/)
- the look and behavior can be controlled by adding optional parameters (listed on the above web page) into the html template in <code>html/gpxviewer_html.template</code>
- the default map is selected in config.php (OpenStreet-Map (OSM,OSMDE) , Google-Map (Karte)) 
- in order to use google maps, an API key is required. The key has to be entered into the script <code>js/GM_utils/GPX2GM_Defs.js</code>
 
TCP/UDP Server
--------------
The GO code opens a port and accepts connections via TCP and UDP. The server just digests the paket and does (usually) not respond. The received data are matched by regular expressions of known device formats (./exe/devices.config). If a match is found and the device ID is known, the GPS data are converted to the format, which is expected by the PHP code and passed via a HTTP connection to the server (e.g. localhost/gpstracker/index.php). The GPS location is then stored in the database. 
Parameters to pass to the server:
```
 -port <portnumber>
 -httpserver <server name - e.g. localhost>
 -urlpath <path on server>
 -key <secret key in order to check the status of the server - used by PHP>
 -verbose - print raw messages, which allows to determine the format send by the device
```
Example call
```
nohup tcp_udp_http_bridge -port 20202 -httpserver localhost -urlpath /gpstracker/index.php -key 123456
```
Encyption of UDP data
---------------------
The tcp/udp server can handle AES encrypted pakets. This requires a server wide PSK in <code>./exe/encrypt_psk.config</code>. Currently this is only implemented in my private version of the GPS logger for Android.  

Information about GPS data formats
----------------------------------
Most devices provide the data as a NMEA GPRMC record (see https://de.wikipedia.org/wiki/NMEA_0183)
```
$GPRMC,162614,A,5230.5900,N,01322.3900,E,10.0,90.0,131006,1.2,E,A*13
identifier, time, Active/Void, latitude, N/S, longitude, E/W, speed, angle, date, magnetic deviation, E/W, signal integrity, check sum 
```
Latitude and longitude are given in degree and minutes (ddmm.mmmm), stored by the server in degree. Speed given in knots and stored by the server in m/sec.

Often a reduced GPRMC record is used (no magnetic deviation), with additional identifiers for the device type, device identified. The identified is often the IMEI number of the device.
Since GPRMC is lacking the altitude and the precision/accuracy, this is sometimes added.
The check sum is calculated by a XOR of all characters (ASCII codes) between the $ and the *

**HTTP format**
```
https://my-server.com?time=UTC&lat=LATITUDE&lon=LONGITUDE&alt=ALTITUDE&acc=ACCURACY&id=DEVICEID (lat and lon given in degree 0-180 and 0-360, respectively) or
https://my-server.com?id=DEVICEID&gprmc=<GPRMC-RECORD> or
```

**TCP/UDP format**

GPS logger for Android (OpenGTS format)
```
uabcde/Y0xXyY/$GPRMC,180725,A,5637.37477,N,1211.26495,E,0.000000,0.000000,021017,,*20
username/deviceid/GPRMC-RECORD
```
GPS logger for Android with appended altitude
```
uabcde/Y0xXyY/$GPRMC,180725,A,5637.37477,N,1211.26495,E,0.000000,0.000000,021017,,*20,alt=100.5
```
**Commcercial devices (TCP/UDP)**

Different formats exist. Usually a short header of 2-3 characters is followed by the IMEI/device identification number of the device, 2 characters status and a more or less complete GPRMC record (w/o $GPRMC header). Some status bits might be added at the end. Most device do send in addition a heartbeart message, which has a different format. Some devices require a login in order to start the communication. This protocol is included in the server and the device configuration, but is currently untested. Currently only a TK103B H02 device is included in devices.config. 

Example GPS location message via UDP
```
*HQ,7893267561,V1,050316,A,2212.8745,N,11346.6574,E,14.28,028,220902,FFFFFFFF#
```
HQ is the manufacturer ID, followed by an identification number and the message type "V1". The GPRMC record is missing the $GPRMC header, the magnetic deviation and the check sum. At the end of the message, status information is given.
