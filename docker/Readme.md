How to Dockerize the GPS Data Server?
=====================================
The setup is assuming Traefik as the network proxy, which takes care of the SSL certificates (Lets Encrypt).

The actual server is accessible under https://gps.example.tld/admin .

General Configuration
-------------
- Change ./html/scripts/config.php 
- Create an entry in ./html/auth/.htpasswd (commandline or online) for the admin page
- Configure the webserver `nginx.conf` 

Docker Configuration
--------------------
The environment is defined in the file .env.
Adjust the following variables to your setup
- DOMAIN: fully qualified domain name (e.g. example.tld)
- GPS_WWW: the folder where the webapp is located (default ./html/).  
- GPS_EXT: the location on the host system where to store the database and the temporary files 

Create and run the Containers
-----------------------------
After the configuration is complete run `sudo docker-compose build` to create the containers `gps-nginx` and `gps-php`
- Start the containers with `sudo docker-compose up -d`
- Stop the containers with `sudo docker-compose down`

Have Fun!