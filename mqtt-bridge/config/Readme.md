Configure the MQTT server
=========================
Inside of the container the configuration is stored in the path `/mosquitto/config`. 
The default configuration in `mosquitto.conf` defines, that data are not stored permanently on disk and the path to the password file.
The password is stored in `password.txt`. To define an user and set the corresponding password, you need to use the command `mosquitto_passwd -c <password file> <username>` inside of the conatiner:
* Start shell in container: `sudo docker exec -it gps-mqtt sh`
* Add user/password to existing file: `mosquitto_passwd mosquitto/config/password.txt <usernamer>`. You will be prompted for the password. 

More information can be found at https://mosquitto.org/documentation/.