Run a MQTT server and Bridge to the Simple GPS-Data Server
==========================================================

Projects like Owntracks (e.g. APP) send the GPS data to a MQTT server. In order to get these data stored and visualized, a bridge code subscribes to the data and sends the data to the TCP-Bridge.

This dockerized version starts a Mosquitto server and runs the bridge code (Golang program) in a separate container.

The configuration is done in the `docker-compose.yml` file by changing the environment variables.
     