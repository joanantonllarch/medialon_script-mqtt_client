// 1. Script Begins
({
    //*************************************************************************
    // 2 - INFO
    //*************************************************************************
    Info:
    {   Title:"Mqtt Client v1.0.1",
        Author:"Joan A. Llarch - Barcelona - June 2019",
        Version:"1.0.1",
        Description:"Mqtt Client - For QoS 0 and 1 - Maximun 3 subscriptions on Setup - Maximum 16 publish messages on command",

        Setup:
        {   ipBroker:
            {   Widget:"LineEdit",
                MaxLength:15,
                Width:100,
                Name:"IP Broker"
            },
            portBroker:
            {   Widget:"LineEdit",
                MaxLength:5,
                Width:100,
                Name:"PORT Broker"
            },
            startup:
            {   Widget:"CheckBox",
                Name:"Run in StartUp",
            },
            clientId:
            {   Widget:"LineEdit",
                MaxLength:32,
                Width:200,
                Name:"Client Id"
            },
            userName:
            {   Widget:"LineEdit",
                MaxLength:32,
                Width:200,
                Name:"User Name"
            },
            password:
            {   Widget:"LineEdit",
                MaxLength:32,
                Width:200,
                Name:"Password"
            },
            divider:
            {   Widget:"Divider",
            },	
            subsTopic1:
            {   Widget:"LineEdit",
                MaxLength:64,
                Width:200,
                Name:"Subscribe Topic 1"
            },	
            subsQos1:
            {   Widget:"ComboBox",
                Name:"Subscribe QoS 1",
                Type:"Enum",
                Items:[ 0, 1 ],
            },
            subsTopic2:
            {   Widget:"LineEdit",
                MaxLength:64,
                Width:200,
                Name:"Subscribe Topic 2",
            },
            subsQos2:
            {   Widget:"ComboBox",
                Name:"Subscribe QoS 2",
                Type:"Enum",
                Items:[ 0, 1 ],
            },
            subsTopic3:
            {   Widget:"LineEdit",
                MaxLength:64,
                Width:200,
                Name:"Subscribe Topic 3",
            },  
            subsQos3:
            {   Widget:"ComboBox",
                Name:"Subscribe QoS 3",
                Type:"Enum",
                Items:[ 0, 1 ],
            },       
            lastWillTopic:
            {   Widget:"LineEdit",
                MaxLength:64,
                Width:200,
                Name:"Last Will Topic"
            },
            lastWillMessage:
            {   Widget:"LineEdit",
                MaxLength:64,
                Width:200,
                Name:"Last Will Message"
            },
            lastWillQos:
            {   Widget:"ComboBox",
                Name:"Last Will QoS",
                Type:"Enum",
                Items:[ 0, 1 ],
            },
            keepAlive:
            {   Widget:"ComboBox",
                Name:"Kepp Alive Seconds",
                Type:"Enum",
                Items:[ "off", 5, 10, 15, 20, 25, 30, 40, 50, 60, 90, 120, 150, 180, 210, 240, 300 ],
                Width:200,
            },
            retain:
            {   Widget:"CheckBox",
                Name:"Retain",
            },
        },  
        Commands: 
        {   publish: 
            {   Name: "Publish",
                GroupName: "Mqtt",
                GroupOrder: "0",
                GroupCmdOrder: "0",
                Params: {
                    topicNum: {
                        Name: "Topic Number",
                        Type: "Enum",
                        Items: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ], 
                    },
                    topic: {
                        Name: "Topic",
                        Type: "String",
                        MaxLength: 64,
                    },
                    payload: {
                        Name: "Payload",
                        Type: "String",
                        MaxLength: 256,
                    },
                    qos: {
                        Name: "QoS",
                        Type: "Enum",
                        Items: [ 0, 1 ],          
                    },  
                },
            },
        },    
    },
    //*************************************************************************
    //  3 - SETUP VARIABLES
    //*************************************************************************
    Setup:
    {   ipBroker: "127.0.0.100",
        portBroker: "1883",
        startup: 1,
        clientId: "",
        userName: "",
        password: "",
        divider: 0,
        subsTopic1: "topic_1",
        subsQos1: 1,
        subsTopic2: "topic_2",
        subsQos2: 1,
        subsTopic3: "topic_3",
        subsQos3: 1,
        lastWillTopic: "Mqtt Manager",
        lastWillMessage: "out of order",
        lastWillQos: 1,
        keepAlive: 90,
        retain: 0,
     },
    //*************************************************************************
    //  4 - DEVICE VARIABLES
    //*************************************************************************
    Device: 
    {   tcpStatus:"closed",
        lastError:"",
        mqttStatus:"",
        subscribePayload_0: "",
        subscribePayload_1: "",
        subscribePayload_2: "",
        publishState: "",       // string of 16 digits with the status of the PUBACKs( QoS 1 ) - 0 unknown, 1 not answer, 2 ok
        // for debug
        // subscribePayload_0_len: "",
        // subscribePayload_1_len: "",
        // subscribePayload_2_len: "",
        // messId: "",
        // data_len: 0,
    },
    //*************************************************************************
    //  4b - LOCAL VARIABLES
    //*************************************************************************
    // definitions
    SUBCRIBE_TOTAL: 3,
    PUBLISH_MAX: 16,
    KEEPALIVE_SECONDS:[ 0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 90, 120, 150, 180, 210, 240, 300 ],
    TIMEOUT_PUBLISH_SECONDS: 15,
    // limits for the "script" health, I think...
    MAXSIZE_SUB_PAYLOAD: 250,
    MAXSIZE_SEND_MESSAGE: 400,
    // 3 (for mqtt 3.0) - 4 (for mqtt 3.1.1)
    MQTT_PROTOCOL_LEVEL:        4,
    // message "constant" types
    MQTT_CTRL_CONNECT:          0x01,       // Client request to connect to Server
    MQTT_CTRL_CONNECTACK:       0x02,       // Connect Acknowledgment
    MQTT_CTRL_PUBLISH:          0x03,       // Publish message
    MQTT_CTRL_PUBACK:           0x04,       // Publish Acknowledgment
    MQTT_CTRL_PUBREC:           0x05,       // Publish Received (assured delivery part 1)
    MQTT_CTRL_PUBREL:           0x06,       // Publish Release (assured delivery part 2)
    MQTT_CTRL_PUBCOMP:          0x07,       // Publish Complete (assured delivery part 3)
    MQTT_CTRL_SUBSCRIBE:        0x08,       // Client Subscribe request
    MQTT_CTRL_SUBACK:           0x09,       // Subscribe Acknowledgment
    MQTT_CTRL_UNSUBSCRIBE:      0x0A,       // Client Unsubscribe request
    MQTT_CTRL_UNSUBACK:         0x0B,       // Unsubscribe Acknowledgment
    MQTT_CTRL_PINGREQ:          0x0C,       // PING Request
    MQTT_CTRL_PINGRESP:         0x0D,       // PING Response
    MQTT_CTRL_DISCONNECT:       0x0E,       // Client is Disconnecting
    // constant flags
    MQTT_CONN_USERNAMEFLAG:     0x80,
    MQTT_CONN_PASSWORDFLAG:     0x40,
    MQTT_CONN_WILLRETAIN:       0x20,
    MQTT_CONN_WILLQOS_1:        0x08,
    MQTT_CONN_WILLQOS_2:        0x18,
    MQTT_CONN_WILLFLAG:         0x04,
    MQTT_CONN_CLEANSESSION:     0x02,
    // mqtt objects
    mqttData: {},
    mqttStatus: { connectedFlag: false, keepAliveCount: 0, pingAnswer: false, publishCount: 0 },
    //*************************************************************************
    //  5 - PUBLIC FUNCTIONS
    //*************************************************************************
    //  START - REALLY IS A RE START...
    Start: function(){
        this.Stop();
        // call loop for ever, every second
        this.setIntervalId = QMedialon.SetInterval(this._loops_for_ever, 1000);
    },
    //*************************************************************************
    //  STOP
    Stop: function(){
        QMedialon.ClearInterval( this.setIntervalId );
        if ( this.mqttStatus.connectedFlag == true )
        {   this._disconnect();
        }
    },
    //*************************************************************************
    //  PUBLISH
    publish: function( topicNum, topic, payload, qos ){
        if ( this.mqttStatus.connectedFlag == true )
        {   var pubBuffer = new Buffer( this.MAXSIZE_SEND_MESSAGE );
            pubBuffer.fill(0);
            var index = 0;
            // calc length of non-header data - two bytes to set the topic_publish size     
            var len = 2;        
            len += topic.length;
            if ( qos > 0 ) 
            {   // qos packet id
                len += 2;  
                this.mqttData.topicPublishQoS[topicNum] = qos;
            }
            else
                this.mqttData.topicPublishQoS[topicNum] = 0;
            len += payload.length;
            // message starts
            pubBuffer[index++] = this.MQTT_CTRL_PUBLISH << 4 | qos << 1 | this.Setup.retain;
            // fill in packet[1] last
            do 
            {   var encodedByte = len % 128;
                len = Math.floor(len/128);
                // if there are more data to encode, set the top bit of this byte
                if ( len > 0 ) 
                {   encodedByte |= 0x80;
                }
                pubBuffer[index++] = encodedByte;
            } 
            while ( len > 0 );
            // topic comes before packet identifier
            index = this._stringformat( pubBuffer, index, topic );
            // add packet identifier used for checking PUBACK in QOS > 0
            if ( qos > 0) 
            {   // message id 16 bits
                this.mqttStatus.publishCount++;
                this.mqttStatus.publishId[topicNum] = this.mqttStatus.publishCount;
                pubBuffer[index++] = ( this.mqttStatus.publishId[topicNum] & 0xFF00 ) >> 8;
                pubBuffer[index++] = this.mqttStatus.publishId[topicNum] & 0x00FF;
            }
            // check max size of the message
            if ( index+payload.length > this.MAXSIZE_SEND_MESSAGE )     
                return;
            // payload
            pubBuffer.write( payload, index, payload.length, "ascii");
            index += payload.length;
            // send
            this.sendBuff = new Buffer( index );
            pubBuffer.copy( this.sendBuff, 0, 0, index );
            this.mqttTcpClient.write( this.sendBuff );
            this.mqttStatus.pingCount = 0;
            // set flag to unknown - clear count timeout
            this.mqttStatus.publishState[topicNum] = 0;
            this.mqttStatus.publishStateCount[topicNum] = 0;
        }
    },

    //*************************************************************************
    //  5b - PRIVATE FUNCTIONS
    //*************************************************************************
    //  LOOPS FOR EVER
    _loops_for_ever: function(){
        // connected?
        if ( this.mqttStatus.connectedFlag == false )
            this._connect();
        else
        {   // check status subscriptions
            for ( var i=0; i<this.SUBCRIBE_TOTAL; i++)
            {  if ( this.mqttStatus.subscribeError[i] != 2 )
                    // subscribe    
                    this._subscribe(i);
            }
            // update counter and check if is needed to ping before keepalive time is reached at 80%
            this.mqttStatus.pingCount++;
            if ( this.mqttStatus.pingCount > this.Setup.keepAlive * 0.8  )
            {   this._pingRequest();
                this.mqttStatus.pingCount = 0;
            }
            // timeout PUBACKs
            var topicNum;
            var aux = "";
            for ( topicNum=0; topicNum<this.PUBLISH_MAX; topicNum++)
            {   if ( this.mqttStatus.publishStateCount[topicNum] > this.TIMEOUT_PUBLISH_SECONDS )
                {   this.mqttStatus.publishStateCount[topicNum] = 0;
                    if ( this.mqttStatus.publishState[topicNum] != 2 && this.mqttData.topicPublishQoS[topicNum] > 0 )
                        // set timeout
                        this.mqttStatus.publishState[topicNum] = 1;
                }
                else
                    this.mqttStatus.publishStateCount[topicNum]++;
                aux = aux + this.mqttStatus.publishState[topicNum];
            }
            this.Device.publishState = aux;
        }
    },
    //*************************************************************************
    //  CONNECT
    _connect: function(){
        var connectBuffer = new Buffer(256);
        connectBuffer.fill(0);
        // initialize mqtt objects
        this._initialize();
        // message: fixed header, connection messsage, no flags
        connectBuffer[0] = this.MQTT_CTRL_CONNECT << 4;
        // num bytes protocol name
        connectBuffer[2] = 0;
        connectBuffer[3] = 4;
        // protocol name MQTT
        connectBuffer.write( "MQTT", 4, 4, "ascii");
        // protocol version
        connectBuffer[8] = this.MQTT_PROTOCOL_LEVEL;
        // connect flags byte - always clean the session
        // bit 1
        connectBuffer[9] = this.MQTT_CONN_CLEANSESSION;
        // set the will flags if needed
        if ( this.Setup.lastWillTopic != "" && this.Setup.lastWillMessage != "" ) {   
            // bit 2
            connectBuffer[9] |= this.MQTT_CONN_WILLFLAG;
            // bits 4-3
            if ( this.Setup.lastWillQos == 1)
                connectBuffer[9] |= this.MQTT_CONN_WILLQOS_1;
            else if ( this.Setup.lastWillQos == 2)
                connectBuffer[9] |= this.MQTT_CONN_WILLQOS_2;
            // bit 5
            if( this.Setup.retain == true )
                connectBuffer[9] |= this.MQTT_CONN_WILLRETAIN;
        }
        // bit 7
        if ( this.Setup.userName != "" )
        {    connectBuffer[9] |= this.MQTT_CONN_USERNAMEFLAG;
            // bit 6
            if ( this.Setup.password != "" )
                connectBuffer[9] |= this.MQTT_CONN_PASSWORDFLAG;
        }
        // keep alive timer in seconds - 16 bits
        connectBuffer[10] = ( this.Setup.keepAlive & 0xFF00 ) >> 8;
        connectBuffer[11] = this.Setup.keepAlive & 0x00FF;
        // client id
        var index = 12;
        if ( this.Setup.clientId != "" ) 
        {   connectBuffer.write(  this.Setup.clientId, index, this.Setup.clientId.length, "ascii" );
            index +=  this.Setup.clientId.length;
        } 
        else
        {   connectBuffer[index++] = 0x00;
            connectBuffer[index++] = 0x00;
        }
        // len + will topic + len + will message
        if ( this.Setup.lastWillTopic != "" && this.Setup.lastWillMessage != "" )
        {   index = this._stringformat( connectBuffer, index, this.Setup.lastWillTopic );
            index = this._stringformat( connectBuffer, index, this.Setup.lastWillMessage ); 
        }
        // username
        if (  this.Setup.userName != "" ) 
        {   index = this._stringformat( connectBuffer, index, this.Setup.userName );
            // password
            if ( this.Setup.password != "" ) 
            {   index = this._stringformat( connectBuffer, index, this.Setup.password );
            } 
        }
        // len - don't include the 2 bytes of fixed header data
        connectBuffer[1] = index - 2;   
        // setup TcpClient
        this.mqttTcpClient.on('data', this._onTcpMessage );
        this.mqttTcpClient.on('error', this._onTcpError );
        this.mqttTcpClient.on('close', this._onTcpClose );
        this.mqttTcpClient.setNoDelay(true);
        // send
        this.sendBuff = new Buffer(index);
        connectBuffer.copy( this.sendBuff, 0, 0, index);
        this.mqttTcpClient.connect( this.Setup.portBroker, this.Setup.ipBroker, this._onTcpConnect);
    },

    //*************************************************************************
    //  DISCONNECT
    _disconnect: function(){
        this.sendBuff = new Buffer(2);
        this.sendBuff[0] = this.MQTT_CTRL_DISCONNECT << 4;
        this.sendBuff[1] = 0;
        this.mqttStatus.pingAnswer = false;
        this.mqttTcpClient.write( this.sendBuff );
        this.mqttTcpClient.end();
        this.mqttStatus.connectedFlag = false;
    },

    //*************************************************************************
    //  SUBSCRIBE
    _subscribe: function( topicNumber ){
        // check topicNumber
        if ( topicNumber === "" )
            return;
        var topicNum = parseInt( topicNumber, 10 );
        if ( isNaN(topicNum))
            return;
        if ( topicNum >= this.SUBCRIBE_TOTAL )
            return;
        // check topic is not empty
        if ( this.mqttData.topicSubscribe[topicNum] != "")
        {   var subBuffer = new Buffer(256);
            subBuffer.fill(0);
            var index = 0;
            // message - packet type subscribe + reserved bits to 0010 ( 0x02 )
            subBuffer[index] = this.MQTT_CTRL_SUBSCRIBE << 4 | 0x02;    
            index+=2;
            // message id 16 bits
            this.mqttStatus.subscribeId[topicNum] = Math.floor((Math.random() * 0xFFFF )+1);
            subBuffer[index++] = ( this.mqttStatus.subscribeId[topicNum] & 0xFF00 ) >> 8;
            subBuffer[index++] = this.mqttStatus.subscribeId[topicNum] & 0x00FF;
            // topic
            index = this._stringformat( subBuffer, index, this.mqttData.topicSubscribe[topicNum] );
            subBuffer[index++] = this.mqttData.topicSubscribeQoS[topicNum];
        }
        else
            return;
        // len
        subBuffer[1] = index - 2;   // don't include the 2 bytes of fixed header data
        // send
        this.sendBuff = new Buffer( index );
        subBuffer.copy( this.sendBuff, 0, 0, index );
        this.mqttTcpClient.write( this.sendBuff );
    },

    //*************************************************************************
    //  UNSUBSCRIBE
    _unsubscribe: function(){
        // toDo
        return;
    },

    //*************************************************************************
    //  PUBACK
    _puback: function( qos, messageId ){
        var pubackBuffer = new Buffer(4);
        pubackBuffer.fill(0);
        var index = 0;
        // message
        pubackBuffer[index++] = this.MQTT_CTRL_PUBACK << 4 | qos << 1;
        pubackBuffer[index++] = 2;
        pubackBuffer[index++] = ( messageId & 0xFF00 ) >> 8;
        pubackBuffer[index] = messageId & 0x00FF;
        this.mqttTcpClient.write( pubackBuffer );
    },

    //*************************************************************************
    //  PING THE BROKER
    _pingRequest: function(){
        this.sendBuff = new Buffer(2);
        this.sendBuff[0] = this.MQTT_CTRL_PINGREQ << 4;
        this.sendBuff[1] = 0;
        this.mqttStatus.pingAnswer = false;
        this.mqttTcpClient.write( this.sendBuff );
    },

    //*************************************************************************
    //  ANSWER A PING
    _pingResponse: function(){
        this.sendBuff = new Buffer(2);
        this.sendBuff[0] = this.MQTT_CTRL_PINGRESP << 4;
        this.sendBuff[1] = 0;
        this.mqttTcpClient.write( this.sendBuff );
    },

    //*************************************************************************
    //  STRING FORMAT - ADD A STRING TO THE BUFFER WITH ITS LENGTH IN FRONT IT, IN 16 bits FORMAT 
    _stringformat: function( buffer, index, data ){
        buffer[index++] = data.length >> 8;
        buffer[index++] = data.length & 0xFF;
        buffer.write(  data, index, data.length, "ascii" );
        // return the new index
        return index + data.length;
    },

    //*************************************************************************
    // CALLBACK DATA RECEIVED
    _onTcpMessage: function ( data ){  
        var index = 0;
        // connected?
        if ( this.mqttStatus.connectedFlag == false )
        {   // is a CONNACK?
            if ( data[index] >> 4 == this.MQTT_CTRL_CONNECTACK && data[index+1] == 0x02 )
            {   index += 2;
                // test Session Present Flag, bit0 del 3e byte -> must be 0 in answer a clean sesion start
                if ( data[index] == 0x00 && data[index+1] == 0x00)
                {   // connexion successeful
                    this.mqttStatus.connectedFlag = true;
                    this.Device.mqttStatus = "connected";
                    this.Device.lastError = "";
                }
                else
                {   this.mqttStatus.connectedFlag = false;
                    this.Device.mqttStatus = "no connected";
                }
            }
        }
        else
        {   do
            {   // is a PUBACK or PUBREC?
                if ( data[index] >> 4 == this.MQTT_CTRL_PUBACK || data[index] >> 4 == this.MQTT_CTRL_PUBREC && data.length == 4  )
                {   index++;
                    if ( data[index++] == 2 )
                    {   var messageId = (data[index++] << 8);
                        messageId += data[index++];
                        for ( var topicNum=0; topicNum<this.PUBLISH_MAX; topicNum++)
                        {   if ( this.mqttData.topicPublishQoS[topicNum] > 0)
                            {   if (  messageId == this.mqttStatus.publishId[topicNum] )
                                {   // ok
                                    this.mqttStatus.publishState[topicNum] = 2;
                                }
                            }
                        }
                    }
                }
                // is a SUBACK?
                else if ( data[index] >> 4 == this.MQTT_CTRL_SUBACK )
                {   index++;
                    if ( data[index++] == 3 )
                    {   var messageId = (data[index++] << 8);
                        messageId += data[index++];
                        for ( var topicNum=0; topicNum<this.SUBCRIBE_TOTAL; topicNum++)
                        {   if (  messageId == this.mqttStatus.subscribeId[topicNum] )
                            {   // 0x00, 0x01, 0x02 at server allowed QoS - 0x80 is an error
                                if ( data[index] !=  0x80 )
                                    // no error: 2
                                    this.mqttStatus.subscribeError[topicNum] = 2;
                                else
                                    this.Device.lastError = "Subscribtion " + topicNum + " Faiure";
                            }
                        }
                        index++;
                    }
                }                
                // is a PUBLISH?
                else if ( data[index] >> 4 == this.MQTT_CTRL_PUBLISH )
                {   var i, topic, lenTopic, lenPayload, remainingLen, messageId, QoS, multiplier;
                    QoS = ( data[index++] & 0x06) >> 1;
                    multiplier  = 1;
                    remainingLen = 0;
                    do
                    {   var encodedByte = data[index++];
                        remainingLen += (encodedByte & 127) * multiplier;
                        multiplier *= 128;
                        if ( multiplier > 128*128*128)
                        {   this.Device.lastError = "Malformed Remaining Length";
                            return;
                        }
                    }
                    while ((encodedByte & 128) != 0);
                    // len topic
                    lenTopic = data[index++]*256;
                    lenTopic += data[index++];
                    lenPayload = remainingLen - 2 - lenTopic;
                    // get topic
                    topic = "";
                    for ( i=index; i<lenTopic+index; i++)
                        topic += String.fromCharCode(data[i]);
                    index += lenTopic;
                    // look for the topic in the subcribe topics list
                    var topicNum = -1;
                    for ( i=0; i<this.SUBCRIBE_TOTAL; i++)
                    {   if ( topic == this.mqttData.topicSubscribe[i]  )
                        {   topicNum = i;
                            break;
                        }
                    }
                    // get messageId
                    if ( QoS > 0 )
                    {   messageId = data[index++]*256;
                        messageId += data[index++];
                        lenPayload -= 2;
                        // debug
                        //this.Device.messId = messageId;
                    }
                    else
                        // debug
                        //this.Device.messId = "no Id";
                    // check if is a valid topic number
                    if ( topicNum < 0 && QoS > 0 )
                    {   // something went wrong - message must be answered always for QoS > 0
                        this._puback( QoS, messageId );
                        return;
                    }
                    // a limit for the input frame size - good for the script health?
                    if ( lenPayload <= this.MAXSIZE_SUB_PAYLOAD )
                    {   // get payload
                        switch (topicNum)
                        {   case 0:
                                this.Device.subscribePayload_0 = "";
                                for ( i=index; i<lenPayload+index; i++)
                                    this.Device.subscribePayload_0 += String.fromCharCode(data[i]);
                                // debug
                                //this.Device.subscribePayload_0_len = lenPayload;
                                break;
                            case 1:
                                this.Device.subscribePayload_1 = "";
                                for ( i=index; i<lenPayload+index; i++)
                                    this.Device.subscribePayload_1 += String.fromCharCode(data[i]);
                                // debug
                                //this.Device.subscribePayload_1_len = lenPayload;
                                break;
                            case 2:
                                this.Device.subscribePayload_2 = "";
                                for ( i=index; i<lenPayload+index; i++)
                                    this.Device.subscribePayload_2 += String.fromCharCode(data[i]);
                                // debug
                                //this.Device.subscribePayload_2_len = lenPayload;
                                break;
                        }
                        this.Device.lastError = "";
                    }
                    else
                        this.Device.lastError = "subscribePayload_" + topicNum + " size is more than " + 
                        this.MAXSIZE_SUB_PAYLOAD + " bytes";
                    index += lenPayload;
                    if ( QoS > 0 )
                        // to answer
                        this._puback( QoS, messageId );
                }
                // is a PINGREQ?
                else if ( data[index] >> 4 == this.MQTT_CTRL_PINGREQ )
                {   index++;
                    if ( data[index++] == 0 )
                        this._pingResponse();
                }
                // is a PINGRESP?
                else if ( data[index] >> 4 == this.MQTT_CTRL_PINGRESP )
                {   index++;
                    if ( data[index++] == 0 )
                        this.mqttStatus.pingAnswer = true;
                }
                // is a UNSUBACK?
                else if ( data[index] >> 4 == this.MQTT_CTRL_SUBACK )
                {   // toDo
                    return;
                }
                // something is wrong
                else
                {   this.Device.lastError = "receive error";
                    return 0;
                }
            }
            while ( index < data.length );
            // debug
            // this.Device.data_len = data.length;
        }
    },

    //*************************************************************************
    // CALLBACK CONNECT
    _onTcpConnect: function(){
        this.Device.tcpStatus = "opened";
        this.Device.lastError = "";
        this.mqttTcpClient.write( this.sendBuff );
    },

    //*************************************************************************
    // CALLBACK ERROR
    _onTcpError: function ( error ){ 
        this.Device.lastError = error.errortext;
    },

    //*************************************************************************
    // CALLBACK CLOSE
    _onTcpClose: function ( flag ){ 
        if ( flag == false )
        {   this.Device.tcpStatus = "closed";
            this.mqttStatus.connectedFlag = false;
            this.Device.mqttStatus = "no connected";
        }
    },

    //************************************************************************
    // INITIALIZE MQTT OBJECTS
    _initialize : function() {
        var i;
        // subscribe
        this.mqttStatus.subscribeId = [];
        this.mqttStatus.subscribeError = [];
        for ( i=0; i<this.SUBCRIBE_TOTAL; i++)
        {   this.mqttStatus.subscribeId[i] = 0;
            this.mqttStatus.subscribeError[i] = 0;
        }
        this.mqttData.topicSubscribe = [ this.Setup.subsTopic1, this.Setup.subsTopic2, this.Setup.subsTopic3 ];
        this.mqttData.topicSubscribeQoS = [ this.Setup.subsQos1, this.Setup.subsQos2, this.Setup.subsQos3 ];
        // publish
        this.mqttStatus.publishId = [];
        this.mqttStatus.publishState = [];
        this.mqttStatus.publishStateCount = [];
        this.mqttData.topicPublish = [];
        this.mqttData.topicPublishQoS = [];
        for ( i=0; i<this.PUBLISH_MAX; i++)
        {   this.mqttStatus.publishId[i] = 0;
            this.mqttStatus.publishState[i] = 0;
            this.mqttStatus.publishStateCount[i] = 0;
            this.mqttData.topicPublish[i] = "";
            this.mqttData.topicPublishQoS[i] = 0;
        }
        // flags & counters
        this.mqttStatus.connectedFlag = false;
        this.mqttStatus.pingCount = 0;
        this.mqttStatus.pingAnswer = false;
        this.mqttStatus.publishCount = 0;
    },

    //*************************************************************************
    // STARTUP FUNCTION
    _mStart : function() {
        this.Setup.keepAlive = this.KEEPALIVE_SECONDS[this.Setup.keepAlive];
        this.mqttTcpClient = QMedialon.CreateSocket();
        this.mqttStatus.connectedFlag == false;
        this.setIntervalId = 0;
        if ( this.Setup.startup == 1)
            this.Start();
    },

// 6. Script Ends
}) 