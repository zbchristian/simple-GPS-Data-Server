Configure the MQTT server
=========================
Inside of the container the configuration is stored in the path `/mosquitto/config`. 
The default configuration in `mosquitto.conf` defines, that data are not stored permanently on disk and the path to the password file.
The passwords are stored in `password.txt`. To define an user and set the corresponding password, you need to use the command `mosquitto_passwd -b <password file> <username> <password>` inside of the conatiner:
* `sudo docker exec gps-mqtt sh -c "mosquitto_passwd -b mosquitto/config/password.txt gps thisIsSecret"`

These credentials for the user `gps` have to be entered in the settings of the Owntracks device.

An essential user is `gpsadmin`, which is used for the mqtt TCP bridge to extract the GPS data from MQTT. 
* `sudo docker exec gps-mqtt sh -c "mosquitto_passwd -b mosquitto/config/password.txt gpsadmin thisIsTheAdminSecret"`

Only the admin account can read the data. All other accounts should be limited to send data to the MQTT server. 
This avoids, that all data are visible to all connected devices using the same account. This is achieved by corresponding entries in `/mosquitto/config/accesscontrol.txt`.
All user accounts should have only write access (see entry for user `gps`).

More information can be found at https://mosquitto.org/documentation/.