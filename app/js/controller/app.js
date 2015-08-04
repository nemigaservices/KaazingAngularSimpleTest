'use strict';

angular.module("webSocketApp", [])
    .constant('webSocketConfig',{
        URL:"ws://localhost:8001/jms",
        TOPIC_PUB:"/topic/testWSTodoTopic",
        TOPIC_SUB:"/topic/testWSTodoTopic",
        username:"",
        password:""
    })
    .controller("mainCtl", function ($scope,$log,$timeout, webSocketConfig) {
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
        $scope.handleMouseoverEvent = function (e, index) {
            $log.info("Event type " + e.type);
            $scope.mouseoverIndex = -1;
            if (e.type === "mouseover") {
                $scope.mouseoverIndex = index;
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
        }
        $scope.logWebSocketMessage=function(msg, cls){
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
        $scope.handleException=function(e){
            $log.error(e);
            $timeout($scope.logWebSocketMessage("Error! "+e, "error"), 100);
        }

        function setupSSO(webSocketFactory) {
            /* Respond to authentication challenges with popup login dialog */
            var basicHandler = new BasicChallengeHandler();
            basicHandler.loginHandler = function(callback) {
                popupLoginDialog(callback);
            }
            webSocketFactory.setChallengeHandler(basicHandler);
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
