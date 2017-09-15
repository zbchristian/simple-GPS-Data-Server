CC=gcc
CPPFLAGS=-I. -std=c++11 
LDFLAGS=-lstdc++ -lm -lboost_system -lboost_regex -lssl -lcrypto -lpthread
DEPS=gps_protocol.hpp 
OBJ=tcp_server.o https_client.o gps_device.o

%.o: %.cpp $(DEPS) 
	$(CC) -c -o $@ $< $(CPPFLAGS)

tcp_http_bridge: $(OBJ) 
	$(CC) -o $@ $^ $(LDFLAGS)
clean:
	rm -rf *.o
