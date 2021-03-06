module.exports = function(RED) {
	"use strict";
	var request = require('request');

    function FuturehomeMode(n) {
        RED.nodes.createNode(this,n);
        
        var node = this;
        
        node.mode = n.mode;
        node.fh_user;

        try {
        	node.fh_user = RED.nodes.getNode(n.user);  
       	} catch (err) {
            node.error("Error, no login node: " + err);
       	}
           
        if (!node.fh_user || !node.fh_user.credentials.access_token || !node.fh_user.credentials.site_id) {
            this.warn("No access token!!");
            return;
        }

        // TODO: use string as input instead of json
       	this.on('input', function (msg) {
       		try {
       			var payload = msg.payload//JSON.parse(msg.payload)
      		} catch (err) {
      			node.log("Error, no payload: "+err)
      			return
      		}

       		if (payload.mode || node.mode) {
				var _mode = node.mode;
				if (payload.mode) {
					node.log("Node setting overwritten by input: " + payload.mode);
					_mode = payload.mode;
				}
				if (_mode == "home" || "away" || "sleep" || "vacation") {
					patchMode(node.fh_user, _mode);
				}	
			}
       	});
    }
	RED.nodes.registerType("mode",FuturehomeMode);

    function patchMode(fh_user, modeType) {
        request.patch({
    		url: "https://" + fh_user.credentials.base_uri +"api/v2/sites/" + fh_user.credentials.site_id,
    		json: true,
    		headers: {
        		"Authorization": "Bearer "  + fh_user.credentials.access_token
    		},
    		form: { mode: modeType },
		}, function(err, result, body) {
    		if (err) {
        		console.log("Problem setting " + modeType + " mode: " + JSON.stringify(err));
         		return;
    		}
    		//console.log("Mode changed! "+body);
    	});
    };	



    function ChangeDevice(n) {
        RED.nodes.createNode(this,n);
        
        var node = this;
        node.device_id = n.device_id;
        node.fh_user;

        try {
        	node.fh_user = RED.nodes.getNode(n.user);  
       	} catch (err) {
            node.error("Error, no login node: " + err);
       	}
           
        if (!node.fh_user || !node.fh_user.credentials.access_token || !node.fh_user.credentials.site_id || !node.device_id) {
            this.warn("No access token!!");
            return;
        }

        // TODO: use string as input instead of json
       	this.on('input', function (msg) {
       		if (msg.payload.hasOwnProperty("power")) {
				patchDevice(node.fh_user, node.device_id, msg.payload);
			} else if (msg.payload.hasOwnProperty("dimValue")) {
				patchDevice(node.fh_user, node.device_id, msg.payload);
            } else if (msg.payload.hasOwnProperty("lockState")) {
                patchDevice(node.fh_user, node.device_id, msg.payload);
			} else if (msg.payload === parseInt(msg.payload, 10)) {
				if (msg.payload >= 0 && msg.payload <= 100) {
					var value = msg.payload.toString();
					msg.payload = {"dimValue": value};
					patchDevice(node.fh_user, node.device_id, msg.payload);
				} else {
					// TODO: error msg
					node.log("int out of range");
				}
			} else if (typeof msg.payload === 'string') {
				// payload is a string
				//console.log("its a string: " + msg.payload);
				switch (msg.payload){
					case "on":
						var value = msg.payload;
						msg.payload = {"power": value};
						patchDevice(node.fh_user, node.device_id, msg.payload);
						break;
					case "off":
						var value = msg.payload;
						msg.payload = {"power": value};
						patchDevice(node.fh_user, node.device_id, msg.payload);
						break;
                    case "unlocked":
                        var value = msg.payload;
                        msg.payload = {"lockState": value};
                        patchDevice(node.fh_user, node.device_id, msg.payload);
                        break;
                    case "locked":
                        var value = msg.payload;
                        msg.payload = {"lockState": value};
                        patchDevice(node.fh_user, node.device_id, msg.payload);
                        break;
					default:
						// TODO: error msg
						node.log("wrong string!");
				}
			} else {
				// TODO: error msg
				node.log("wrong input val");
			}
      		
       	});
    }
	RED.nodes.registerType("change-device",ChangeDevice);

	// State : {dimValue: 1..100} {power: "on"/"off"}
    function patchDevice(fh_user, device_id, state) {
    	request.patch({
    		url: "https://" + fh_user.credentials.base_uri +"api/v2/sites/" + fh_user.credentials.site_id + "/devices/" + device_id,
    		json: true,
    		headers: {
        		"Authorization": "Bearer "  + fh_user.credentials.access_token
    		},
    		form: state,
		}, function(err, result, body) {
    		if (err) {
        		console.log("Problem setting " + JSON.stringify(state) + " : " + JSON.stringify(err));
         		return;
    		}
    		// TODO: feedback that command is sent
    		//console.log("Command sent! "+body);
    	});

    };


    function ChangeRoom(n) {
        RED.nodes.createNode(this,n);
        
        var node = this;
        node.room_id = n.room_id;
        node.fh_user;

        try {
            node.fh_user = RED.nodes.getNode(n.user);  
        } catch (err) {
            node.error("Error, no login node: " + err);
        }
           
        if (!node.fh_user || !node.fh_user.credentials.access_token || !node.fh_user.credentials.site_id || !node.room_id) {
            this.warn("No access token, or site, or room_id!!");
            return;
        }

        this.on('input', function (msg) {
            if (msg.payload.hasOwnProperty("temperature")) {
                patchRoom(node.fh_user, node.room_id, msg.payload);
            } else if (msg.payload === parseInt(msg.payload, 10)) {
                if (msg.payload >= 5 && msg.payload <= 50) {
                    var value = parseFloat(msg.payload).toFixed(1);
                    msg.payload = {"temperature": value};
                    patchRoom(node.fh_user, node.room_id, msg.payload);
                } else {
                    // TODO: error msg
                    node.log("int/float out of range");
                }
            } else if (msg.payload === parseFloat(msg.payload)) {
                if (msg.payload >= 5.0 && msg.payload <= 50.0) {
                    var value = msg.payload.toFixed(1);
                    msg.payload = {"temperature": value};
                    patchRoom(node.fh_user, node.room_id, msg.payload);
                }else {
                    // TODO: error msg
                    node.log("int/float out of range");
                }
            } else {
                // TODO: error msg
                node.log("wrong input val");
            }
            
        });
    }
    RED.nodes.registerType("change-room",ChangeRoom);


    // State : {temperature: 5..50} {temperature: "19,5"} float
    function patchRoom(fh_user, room_id, state) {
        request.patch({
            url: "https://" + fh_user.credentials.base_uri +"api/v2/sites/" + fh_user.credentials.site_id + "/rooms/" + room_id,
            json: true,
            headers: {
                "Authorization": "Bearer "  + fh_user.credentials.access_token
            },
            form: state,
        }, function(err, result, body) {
            if (err) {
                console.log("Problem setting " + JSON.stringify(state) + " : " + JSON.stringify(err));
                return;
            }
            // TODO: feedback that command is sent
            //console.log("Command sent! "+body);
        });

    };

    function Shortcut(n) {
        RED.nodes.createNode(this,n);
        
        var node = this;
        node.shortcut_id = n.shortcut_id;
        node.fh_user;

        try {
        	node.fh_user = RED.nodes.getNode(n.user);  
       	} catch (err) {
            node.error("Error, no login node: " + err);
       	}
           
        if (!node.fh_user || !node.fh_user.credentials.access_token || !node.fh_user.credentials.site_id || !node.shortcut_id) {
            this.warn("No access token!!");
            return;
        }

        // TODO: use string as input instead of json
       	this.on('input', function (msg) {
       		//console.log(msg);
       		if (msg.payload.hasOwnProperty("shortcut")) {
       			// TODO
       			// use this to overrun shortcut on node
       			// check if shortcut is a number
       			// then runSortcut
				//runShortcut(node.fh_user, DODO);
			} else if (msg.payload === parseInt(msg.payload, 10)) {
				if (msg.payload >= 0 && msg.payload <= 100) {
					var s_id = msg.payload.toString();
					runShortcut(node.fh_user, s_id);
				} else {
					// RUN shortcut defined in node
					runShortcut(node.fh_user, node.shortcut_id);
				}
			} else {
				// RUN shortcut defined in node
				runShortcut(node.fh_user, node.shortcut_id);
			}
      		
       	});
    }
	RED.nodes.registerType("shortcut",Shortcut); 


	function runShortcut(fh_user, shortcut_id) {
		request.patch({
    		url: "https://" + fh_user.credentials.base_uri +"api/v2/sites/" + fh_user.credentials.site_id,
    		json: true,
    		headers: {
        		"Authorization": "Bearer "  + fh_user.credentials.access_token
    		},
    		form: { shortcut: shortcut_id },
		}, function(err, result, body) {
    		if (err) {
        		console.log("Problem setting shortcut id: " + shortcut_id + " : " + JSON.stringify(err));
         		return;
    		}
    		// TODO: notifi that shortcut was run
    		//console.log("Shortcut command sent! "+body);
    	});
	};


    RED.httpAdmin.get('/output/shortcuts', function(req, res){
        if (!req.query.id) {
            res.status(400);
            res.send("No node-id");
            return;
        }
        var node_id = req.query.id;
        var credentials = RED.nodes.getCredentials(node_id);
        if (!credentials) {
            res.status(400);
            res.send("Missing site information. Press Done, and try again.");
            return;
        }

        request.get({
            url: "https://" + credentials.base_uri + "api/v2/sites/" + credentials.site_id + "/shortcuts",
            json: true,
            headers: {
                "Authorization": "Bearer " + credentials.access_token
            },
        }, function(err, result, data) {
            if (err) {
                console.log("Problem getting shortcuts: " + JSON.stringify(err));
                return;
            }
            if (data.error) {
                console.log(JSON.stringify(data.error));
                res.status(400);
                res.send(data.error);
                return;
            }
            if (!data.shortcuts) {
                console.log("Missing shortcuts in response.");
                res.status(400);
                res.send("No shortcuts!");
            } else {
                //console.log("Sending list of shortcuts: ")
                //console.log(data.shortcuts);
                res.send(data.shortcuts);
            }

        });
    });
    

    function GetState(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.get_type = n.get_type;
        node.device_id = n.device_id;
        node.room_id = n.room_id;
        node.fh_user;

        try {
            node.fh_user = RED.nodes.getNode(n.user);  
        } catch (err) {
            node.error("Error, no login node: " + err);
        }
         //  if (!node.fh_user || !node.fh_user.credentials.access_token || !node.fh_user.credentials.site_id || !node.device_id)
        if (!node.fh_user || !node.fh_user.credentials.access_token || !node.fh_user.credentials.site_id) {
            this.warn("No access token!!");
            return;
        }
        
        // TODO: use string as input instead of json
        this.on('input', function (msg) {
            if (msg.payload.hasOwnProperty("type") && msg.payload.hasOwnProperty("id")) {
                if (typeof msg.payload.type === 'string' && typeof msg.payload.id === 'string') {
                    getState(msg.payload.type, msg.payload.id);
                } else {
                    node.warn("Input is not typeof 'string'");
                }
            }  else {
                if (node.get_type == "devices") {
                    if (node.device_id) {
                        getState(node.get_type, node.device_id);
                    } else {
                        node.warn("node is missing device id");
                    }
                } else if (node.get_type == "rooms") {
                    if (node.room_id) {
                        getState(node.get_type, node.room_id);
                    } else {
                        node.warn("node is missing room id");
                    }
                } else {
                    node.warn("type is not set");
                }
            }  
        });
        
        // type has to be: "rooms" or "devices"
        function getState(type, id) {
            request.get({
            url: "https://" + node.fh_user.credentials.base_uri + "api/v2/sites/" + node.fh_user.credentials.site_id + "/" + type + "/" + id,
            json: true,
            headers: {
                "Authorization": "Bearer " + node.fh_user.credentials.access_token
            },
            }, function(err, result, data) {
                if (err) {
                    console.log("Problem getting shortcuts: " + JSON.stringify(err));
                    return;
                }
                if (data.error) {
                    node.log(JSON.stringify(data.error));
                    return;
                } else {
                    //console.log("Sending recived data: ")
                    //console.log(data);
                    node.send({payload: data});
                    //res.send(data.shortcuts);
                }
            });
        }
    }
    RED.nodes.registerType("get-state",GetState);


    RED.httpAdmin.get('/output/rooms', function(req, res){
        if (!req.query.id) {
            res.status(400);
            res.send("No node-id");
            return;
        }
        var node_id = req.query.id;
        var credentials = RED.nodes.getCredentials(node_id);
        if (!credentials) {
            res.status(400);
            res.send("Missing site information. Press Done, and try again.");
            return;
        }

        request.get({
            url: "https://" + credentials.base_uri + "api/v2/sites/" + credentials.site_id + "/rooms", // + "/rooms"
            json: true,
            headers: {
                "Authorization": "Bearer " + credentials.access_token
            },
        }, function(err, result, data) {
            if (err) {
                console.error("Problem getting rooms: " + JSON.stringify(err));
                return;
            }
            if (data.error) {
                console.log(JSON.stringify(data.error));
                res.status(400);
                res.send(data.error);
                return;
            }
            if (!data) {
                console.log("Missing rooms in response.");
                res.status(400);
                res.send("Missing rooms in response.");
            } else {
                //console.log("Sending devices: ")
                //console.log(data._embedded);
                res.send(data);
            }

        });
    });

    
}