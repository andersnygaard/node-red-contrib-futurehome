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
            console.log("Error: " + err);
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
      			console.log("ERROR: "+err)
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
        		console.log("request error:" + err);
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
            console.log("Error: " + err);
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
			} else if (msg.payload === parseInt(msg.payload, 10)) {
				if (msg.payload >= 0 && msg.payload <= 100) {
					var value = msg.payload.toString();
					msg.payload = {"dimValue": value};
					patchDevice(node.fh_user, node.device_id, msg.payload);
				} else {
					// TODO: error msg
					console.log("int out of range");
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
					default:
						// TODO: error msg
						console.log("wrong string!");
				}
			} else {
				// TODO: error msg
				console.log("wrong input val");
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
        		console.log("request error:" + err);
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
            console.log("Error: " + err);
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
        		console.log("request error:" + err);
         		return;
    		}
    		// TODO: notifi that shortcut was run
    		//console.log("Shortcut command sent! "+body);
    	});
	};


    RED.httpAdmin.get('/output/shortcuts', function(req, res){
        if (!req.query.id) {
            res.sendStatus(400);
            return;
        }
        var node_id = req.query.id;
        var credentials = RED.nodes.getCredentials(node_id);

        request.get({
            url: "https://" + credentials.base_uri + "api/v2/sites/" + credentials.site_id + "/shortcuts",
            json: true,
            headers: {
                "Authorization": "Bearer " + credentials.access_token
            },
        }, function(err, result, data) {
            if (err) {
                console.log("request error:" + err);
                return;
            }
            if (data.error) {
                console.log("oauth error: " + data.error);
                return;
            }
            if (!data.shortcuts) {
                console.log("No shortcuts!");
                res.sendStatus(400);
            } else {
                //console.log("Sending list of shortcuts: ")
                //console.log(data.shortcuts);
                res.send(data.shortcuts);
            }

        });
    });


}