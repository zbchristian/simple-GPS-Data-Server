How to Dockerize the GPS Data Server?
=====================================
Copy the project folders `webapp` and `tcp_udp_http_bridge` to your container folder 
First you need to copy the `webapp` folder, which contains the PHP source code and the TCP/UDP bridge, into a subdirectory of this docker setup (e.g. `./webapp/`). This directory is copied directly into the containers.
Afterwards go through the configuration steps below.

The setup is using Traefik as the network proxy, which takes care of the SSL certificates (Lets Encrypt). The certificate is automatically requested and installed. This might tale a moment at the first start.
The actual server is in the end accessible under https://gps.example.tld/admin .

General Configuration
---------------------
- Change `./webapp/scripts/config.php` 
- Create an entry in `./webapp/auth/.htpasswd` (commandline `htpasswd` or online) for the admin page
- Configure the webserver `nginx.conf` 

Docker Configuration
--------------------
The environment can be defined in the file `.env`, or directly in the compose file (remove `.env` in this case).
Adjust at least the following environment variables to your setup. 
- DOMAIN: fully qualified domain name (e.g. `example.tld`)
- GPS_WWW: the folder where the webapp is located (e.g. `./webapp/`).  
- GPS_EXT: the location on the host system where to store the database and the temporary files. This should be owned by the user/group `www-data` (33:33). Create the subdirectories `db/` and `temp/` 

For Traefik
- LE_PATH: location to store the lets encrypt certificates
- LE_MAIL: email address to be used for the certificate request

Create and run the Containers
-----------------------------
After the configuration is complete run `sudo docker-compose build` to create the containers `gps-nginx`, `gps-php` and `gps-tcp-udp-bridge`
- Start Traefik `sudo docker-compose docker-compose-trafik.yml up -d`
- Start the containers with `sudo docker-compose up -d`
- Stop the containers with `sudo docker-compose down`
- Stop Traefik `sudo docker-compose docker-compose-trafik.yml down`

Have Fun!
