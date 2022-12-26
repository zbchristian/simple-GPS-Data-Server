Build the TCP/UDP Bridge
========================
To install the golang compiler and to build the program  
- `sudo apt install golang`
- There is an additional crypto package needed: `go get -u golang.org/x/crypto/pbkdf2`
- Compile the program by running `go build` in this directory
- The executable expects the two files `devices.config` and `encrypt_psk.config` in the same directory
- Copy the executable and these two files to a location of your choice
- The server is started by the PHP code, when the admin page is opened.So PHP needs to have access to this folder (e.g. a directory in the webapp path). Change `config.php` accordingly.
- Alternatively, create a crontab entry

Golang executables usually have no external dependencies, so the sexecutable can be copied to other machines of the same platform. You can cross-compile the code for a different platform as well, see the golang documentation.


Options
-------
Run `./tcp_udp_http_bridge --help` to see the options to pass to the program.

    -httpserver string
        name of HTTP server (default "http://localhost")
    -key string
        secret key to terminate program via TCP/UDP port (default "12345")
    -port int
        port number (default 20202)
    -urlpath string
        relative url path (default "index.php")
    -verbose
        enable verbose logging output

Run the server
--------------
Just running the program in foreground without any options:
- Read the device list from `devices.config` in the local directory
- Read the pre-shared key encryption key from `encrypt_psk.config`
- Communication secret key (used by the PHP code) set to 12345
- Start the servers for incoming GPS data on TCP and UDP port 20202 (yes its the same port) 
- Valid data are passed to `http://localhost/index.php` (this server and the webserver/PHP running on the same host)
- The server can be stopped by sending `exit 12345` (actual secret key) to port 20202 (actual used port): `echo "exit 12345" | netcat localhost 20202`


Configure Devices
-----------------
The configuration file `devices.config` is mainly in JSON format ("key", value pairs), but with comment lines "//" and some special keywords (see below).
The messages from devices are matched using regular expressions (case insensitive).

**Test your regular expressions at https://regex101.com for an example message and  duplicate each "\" after the expression works**

### JSON keys per device

**Device:**
-name of device (string)

**Mode:**
- "string" or "binary". Default is "string" 
  - Binary data will be converted to a hex string before matching starts

Three regular expression patterns (`"msg":`) are needed per device, but can be empty. All regular expression are evaluated case insensitive!

**Login** 
- login message of device. Default: `{ "msg":"", "resp":"" }`

**Heartbeat** 
- heartbeat message of the device. Default: `{ "msg":"", "resp":"" }`

**Gps_data** 
- the actual message containing GPS data. `{ "msg":"", "resp":"" }`

Example message pattern: `"msg":"^\\*\\w{2},(\\d{15}),XT,[V|A]*,([0-9]+),([0-9]+)#\\s*$"`

For each message type a, currently static, response (e.g. `"resp":"OK"`) can be defined

For each type a set of Order, Units and Scale keys can be added. These are arrays and each elements refers to the corresponding matched group of the regular expression.

**Order:**
 - Array of int - assign the corresponding parameter to the matched pattern (regexp group) as a keyword (see below). The keywords are replaced automatically. 
   - Example: for a login message the device ID (`%DEVID%`) can be extracted. For GPS data the latitude `%LAT%`,longitude `%LON%` etc has to be specified

**Units:**
 - Array of int - for each parameter which is defined in "Order", the unit of the parameter has to be defined as a keyword(e.g. `%DEGREE%`) or `%NONE%`

**Scale:**
  - Array of floats - Parameters might have been scaled in order to fit into the data format. This scaling has to be inverted. The scale value is a float value.
    - Example: an integer is send, but represents the latitude in `minutes*30000`. Unit can be given as `%DEGREE%` and the scaling would be `1/30000/60=5.5555555E-7`. This inverts the factor 30000 and scales minutes to degree

**Bits:**
 - Array of hex strings - Mask bits and extract string/value. The input string is assumed to be in hex format! 
   - **pat:** array of strings - hex number to mask bits (e.g. "3ff")
   - **res:** array of strings - result of the operation (true:false). Give two string separated by ":" (e.g. "N:S"). Empty string, if the value should be used directly
   - Hint: in order to apply different bit masks to the same byte, you need to capture the same regexp group multiple times:
     - Byte captured once ([[:xdigit:]]{2})
     - Byte captured twice (([[:xdigit:]]{2})) etc. 
   - Example: capture 2 bytes (course angle) and 3 times the first byte (NS, EW, ACTIVE)
   
        Gps_data":     {
                "msg":  "^(((([[:xdigit:]]{2})))[[:xdigit:]]{2}).*0D0A$",     "resp":"OK",
                "Order":  [    %ANGLE%,    %NS%,  %EW%, %ACTIVE% ],
                "Units":  [    %DEGREE%, %NONE%, %NONE%, %NONE% ],
				"Bits": { "pat": [ "2ff",    "4",  "8" ,   "10"],
                          "res": [  "",    "N:S",  "W:E",  "A:V"]
						}
			}

The GPS data record is described by a regular expresssion
Each match in the regular expression has to be accompanied by an **Order** and **Units** list. If the device sends a `GPRMC` record, the `%GPRMC%` keyword can be used.

ALL KEYWORDS HAVE TO BE ENCLOSED IN "%", e.g. `%DEVIMEI%` for the device IMEI number

**Allowed Keywords:**
```
REGEXP_GPRMC : regular expression for the standard GPRMC record w/o $GPRMC header, magnetic deviation and check sum (from TIME up to DATE)
                "([0-9]{6},[A|V]*,[0-9.]+,[N|S],[0-9.]+,[E|W],[0-9.]+,[0-9.]+,[0-9]{6})"
"Order": [       TIME,   ACTIVE,  LAT,    NS,   LON,    EW,   SPEED,  ANGLE,   DATE]
"Units": [       NONE,    NONE,  DEGMIN, NONE, DEGMIN, NONE,  KNOTS, DEGREE,   NONE]

DEVIMEI  : device IMEI number. This might be the identification of the device (no DEVID present)
DEVID    : device ID defined in the HTTP interface and provided by device
ACTIVE   : A or V (active or void) entry
LAT      : latitude
NS       : N or S (North or South)
LON      : longitude
EW       : E or W (East or West)
SPEED    : current speed
ANGLE    : angle of movement
TIME     : time (HHMMSS)
DATE     : date (DDMMYY). For inverse date (YYMMDD) set units to "INV"
ALT      : altitude
ACC      : accuracy/precision of location

Units:
DEGMIN   : format of lat/lon  in degree*100 + minutes (GPRMC format)
DEGREE   : format of lat/lon/angle  in degree
KMPERH   : speed in km/h
MPERS    : speed in m/s
KNOTS    : speed in knots
INV      : invert order (e.g. DATE YYMMDD to DDMMYY)
```
