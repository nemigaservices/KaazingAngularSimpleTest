'use strict';

angular.module("webSocketApp", [])
    .controller("mainCtl", function ($scope,$log) {
        $scope.localMessages=[];
        $scope.webSocketMessage="";
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
            var msg="Item "+item.id+" is now "+((item.complete)?"completed":"incomplteted!");
            $log.info(msg);
            var msgObj={
                id:$scope.localMessages.length,
                message:msg
            }
            $scope.localMessages.push(msgObj);
        }

    })
;
