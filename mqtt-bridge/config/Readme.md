Configure the MQTT server
=========================
Inside of the container the configuration is stored in the path `/mosquitto/config`. 
The default configuration in `mosquitto.conf` defines, that data are not stored permanently on disk and the path to the password file.
The password is stored in `password.txt`. To define an user and set the corresponding password, you need to use the command `mosquitto_passwd -b <password file> <username> <password>` inside of the conatiner:
* `sudo docker exec gps-mqtt sh -c "mosquitto_passwd -b mosquitto/config/password.txt myuser thisIsSecret"`

More information can be found at https://mosquitto.org/documentation/.