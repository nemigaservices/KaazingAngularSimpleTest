'use strict';

angular.module("webSocketApp", ['uuid'])
    .constant('webSocketConfig',{
        URL:"ws://localhost:8001/jms",
        TOPIC_PUB:"/topic/testWSTodoSnd",
        TOPIC_SUB:"/topic/testWSTodoRcv",
        username:"",
        password:""
    })
    .controller("mainCtl", function ($scope,$log,$timeout, uuid4, webSocketConfig) {
        $scope.appId=uuid4.generate();
        $scope.localMessages=[];
        $scope.webSocketMessages=[];
        $scope.todos = [
            {id:1, action: "Get groceries", complete: false},
            {id:2, action: "Call plumber", complete: false},
            {id:3, action: "Buy running shoes", complete: true},
            {id:4, action: "Buy flowers", complete: false},
            {id:5, action: "Call family", complete: false}];
        $scope.mouseoverIndex = -1;
        $scope.data = {
            rowColor: "Blue"
        }
        $scope.buttonNames = ["Gray", "Yellow", "Blue"];

        $scope.handleMouseoverEvent = function (e, index, item) {
            $log.info("Event type " + e.type);
            $scope.mouseoverIndex = -1;
            if (e.type === "mouseover") {
                $scope.mouseoverIndex = index;
                $scope.sendCommand(item,"busy");
            }
            else{
                $scope.sendCommand(item,"available");
            }
        }
        $scope.getDoneColor = function (item, index) {
            if ($scope.mouseoverIndex == index) {
                if (item.complete)
                    return 'MouseOverDone';
                else
                    return 'MouseOverNotDone';
            }
            else if (item.complete)
                return 'Done';
            else
                return 'NotDone';
        }
        $scope.itemClicked=function(item){
            var msg="Item "+item.id+" is now "+((item.complete)?"completed":"incompleted!");
            $log.info(msg);
            var msgObj={
                id:$scope.localMessages.length,
                message:msg
            }
            $scope.localMessages.push(msgObj);
            $scope.sendCommand(item,((item.complete)?"complete":"incomplete"))
        }
        $scope.logWebSocketMessageImpl=function(msg, cls){
            if (cls===undefined || cls==null)
                cls="info";
            $log.info("From WebSocket: "+msg);
            var msgObj={
                id:$scope.webSocketMessages.length,
                class:"msg-"+cls,
                message:msg
            }
            $scope.webSocketMessages.push(msgObj);

        }
        $scope.logWebSocketMessage=function(msg, cls){
            $timeout($scope.logWebSocketMessageImpl(msg, cls), 100);
        }

        $scope.handleException=function(e){
            $log.error(e);
            $scope.logWebSocketMessage("Error! "+e, "error");
        }

        function setupSSO(webSocketFactory) {
            /* Respond to authentication challenges with popup login dialog */
            var basicHandler = new BasicChallengeHandler();
            basicHandler.loginHandler = function(callback) {
                popupLoginDialog(callback);
            }
            webSocketFactory.setChallengeHandler(basicHandler);
        }

        $scope.prepareSend=function(){
            var dest=$scope.session.createTopic(webSocketConfig.TOPIC_PUB);
            $scope.producer = $scope.session.createProducer(dest);
            $scope.logWebSocketMessage("Producer is ready! AppID="+$scope.appId);
        }

        $scope.prepareReceive=function(rcvFunction){
            var dest=$scope.session.createTopic(webSocketConfig.TOPIC_SUB);
            $scope.consumer = $scope.session.createConsumer(dest,"appId<>'"+$scope.appId+"'");
            $scope.consumer.setMessageListener(function(message) {
                rcvFunction(message.getText());
            });
            $scope.logWebSocketMessage("Consumer is ready!");
        }

        $scope.onMessage=function(message){
            var cmd=angular.fromJson(message);
            $scope.logWebSocketMessage("Received from: "+cmd.from+", command: "+cmd.command+", item id: "+cmd.item,"received")
        }

        $scope.sendCommand=function(item, command){
            var cmd={
                from: $scope.appId,
                command:command,
                item:item.id
            }

            var msg=angular.toJson(cmd);
            var textMsg = $scope.session.createTextMessage(msg);
            textMsg.setStringProperty("appId", $scope.appId);
            try {
                var future = $scope.producer.send(textMsg, function(){
                    if (future.exception) {
                        $scope.handleException(future.exception);
                    }
                });
            } catch (e) {
                $scope.handleException(e);
            }
            $scope.logWebSocketMessage("Send command "+msg,"sent");

        }

        $scope.connectToWebSocket=function() {

            $scope.logWebSocketMessage("CONNECTING TO: " + webSocketConfig.URL);

            var jmsConnectionFactory = new JmsConnectionFactory(webSocketConfig.URL);

            //setup challenge handler
            setupSSO(jmsConnectionFactory.getWebSocketFactory());
            try {
                var connectionFuture =
                    jmsConnectionFactory.createConnection(webSocketConfig.username, webSocketConfig.password, function () {
                        if (!connectionFuture.exception) {
                            try {
                                $scope.connection = connectionFuture.getValue();
                                $scope.connection.setExceptionListener($scope.handleException);

                                $scope.logWebSocketMessage("CONNECTED");

                                $scope.session = $scope.connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

                                $scope.connection.start(function () {
                                    $scope.logWebSocketMessage("JMS session created");
                                    $scope.prepareSend();
                                    $scope.prepareReceive($scope.onMessage);
                                });
                            }
                            catch (e) {
                                $scope.handleException(e);
                            }
                        }
                        else {
                            $scope.handleException(connectionFuture.exception);
                        }
                    });
            }
            catch (e) {
                $scope.handleException(e);
            }

        }
        $scope.connectToWebSocket();
    })
;
