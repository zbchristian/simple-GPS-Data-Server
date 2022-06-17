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


 
