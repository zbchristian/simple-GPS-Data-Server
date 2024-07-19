# Run a MQTT server and Bridge to the Simple GPS-Data Server

Projects like Owntracks (e.g. APP) send the GPS data to a MQTT server. In order to get these data stored and visualized, a bridge code subscribes to the data and sends the data to the TCP-Bridge.

This dockerized version starts a Mosquitto server and runs the bridge code (Golang program) in a separate container.

The MQTT configuration is done in the corresponding `config` directory.
Parameters are configurated in`docker-compose.yml` by changing the environment variables.

## Encrypting the payload
The Owntracks client allows to encrypt the payload, e.g. the GPS data. This requires to enter a pre-shared key in the client. Only a single key can used for all client devices. 
The PSK has to be known by the bridge code and has to be entered as a parameter in `docker-compose.yml` (`PSK_ENC`). 